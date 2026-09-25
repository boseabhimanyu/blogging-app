package router

import (
	"blogging-app/auth"
	"blogging-app/config"
	"blogging-app/handler"
	"blogging-app/models"
	mongorepo "blogging-app/repository/mongo"
	"blogging-app/services"
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	mongo "go.mongodb.org/mongo-driver/v2/mongo"
)

func NewRouter(database *mongo.Database, cfg config.Config) *gin.Engine {
	r := gin.Default()

	r.Static("/Uploads", "./Uploads") // Expose file uploads

	// Repositories
	userRepository := mongorepo.NewUserRepository(database)
	postRepository := mongorepo.NewMongoPostRepository(database)
	// tagRepository := mongorepo.NewTagRepository(database) // Kept nil/dormant for now

	// Services
	authService := services.NewAuthService(userRepository, cfg)
	userService := services.NewUserService(userRepository)
	postService := services.NewPostService(postRepository, nil)

	refreshToken := func(
		ctx context.Context,
		refreshToken string,
	) (string, string, time.Time, error) {
		result, err := authService.RefreshToken(ctx, refreshToken)
		if err != nil {
			return "", "", time.Time{}, err
		}

		return result.AccessToken,
			result.RefreshToken,
			result.RefreshExpiry,
			nil
	}

	authMiddleware := auth.AuthMiddleware(
		cfg.JWTSecret,
		cfg.AuthAccessCookie,
		cfg.AuthRefreshCookie,
		cfg.CookieSecure,
		cfg.JWTExpiryHours,
		refreshToken,
	)

	// Optional auth middleware: extracts identity if logged in, but never blocks anonymous visitors
	optionalAuthMiddleware := auth.OptionalAuthMiddleware(
		cfg.JWTSecret,
		cfg.AuthAccessCookie,
	)

	// Handlers
	authHandler := handler.NewAuthHandler(authService, cfg)
	userHandler := handler.NewUserHandler(userService)
	postHandler := handler.NewPostHandler(postService)

	// Global/Public Endpoints
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"ok":     true,
			"status": "Happy Blogging",
		})
	})

	// Authentication routes
	authRoutes := r.Group("/api/v1/auth")
	{
		// Public
		authRoutes.POST("/register", authHandler.Register)
		authRoutes.POST("/login", authHandler.Login)
		authRoutes.POST("/refresh", authHandler.Refresh)

		// Authenticated
		protected := authRoutes.Group("")
		protected.Use(authMiddleware)

		protected.PATCH("/password", authHandler.ChangePassword)
		protected.POST("/logout", authHandler.Logout)
		protected.PATCH("/me", userHandler.UpdateProfile)
		protected.PATCH("/me/image", userHandler.UpdateProfilePic)
		protected.GET("/me", userHandler.Me)
	}

	// Admin user management routes
	adminUserRoutes := r.Group("/api/v1/users")
	adminUserRoutes.Use(
		authMiddleware,
		auth.RequireRoles(string(models.RoleAdmin)),
	)
	{
		adminUserRoutes.POST("", userHandler.CreateUser)
		adminUserRoutes.GET("", userHandler.ListUsers)
		adminUserRoutes.GET("/:id", userHandler.GetUserByID)
		adminUserRoutes.PATCH("/:id", userHandler.UpdateUserProfile)
		adminUserRoutes.PATCH("/:id/status", userHandler.UpdateUserStatus)
		adminUserRoutes.PATCH("/:id/password", userHandler.ChangeUserPassword)
		adminUserRoutes.PATCH("/:id/role", userHandler.UpdateRole)
	}

	// Post routes
	postRoutes := r.Group("/api/v1/posts")
	{
		// Public listings (filters: ?tagId=...&page=1&limit=10)
		postRoutes.GET("", postHandler.ListPublished)

		// Protected post endpoints (Authors & Admins)
		// Note: Specific paths like /me MUST be registered before /:slug to avoid route collisions
		protectedPosts := postRoutes.Group("")
		// protectedPosts.Use(authMiddleware) // if all users want to create and update posts.
		protectedPosts.Use(
			authMiddleware,

			auth.RequireRoles(string(models.RolePublisher), string(models.RoleAdmin)),
		)

		{
			protectedPosts.POST("", postHandler.CreatePost)
			protectedPosts.GET("/me", postHandler.ListMyPosts)
			protectedPosts.PATCH("/:id", postHandler.UpdatePost)
			protectedPosts.DELETE("/:id", postHandler.DeletePost)
		}

		// Public reading with optional auth so authors/admins can preview unpublished drafts
		postRoutes.GET("/:slug", optionalAuthMiddleware, postHandler.GetPostBySlug)
	}

	return r
}
