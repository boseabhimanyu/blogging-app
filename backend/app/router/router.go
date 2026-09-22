package router

import (
	"blogging-app/auth"
	"blogging-app/config"
	"blogging-app/handler"
	"blogging-app/models"
	mongorepo "blogging-app/repository/mongo"
	"blogging-app/services"
	"net/http"

	"github.com/gin-gonic/gin"
	mongo "go.mongodb.org/mongo-driver/v2/mongo"
)

func NewRouter(database *mongo.Database, cfg config.Config) *gin.Engine {
	r := gin.Default()

	r.Static("/Uploads", "./Uploads") // Expose file uploads

	// Dependencies
	userRepository := mongorepo.NewUserRepository(database)
	authService := services.NewAuthService(userRepository, cfg)
	userService := services.NewUserService(userRepository)
	authHandler := handler.NewAuthHandler(authService, cfg)
	userHandler := handler.NewUserHandler(userService)

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

		// Authenticated
		protected := authRoutes.Group("")
		protected.Use(auth.AuthMiddleware(
			cfg.JWTSecret,
			cfg.AuthAccessCookie,
		))

		protected.PATCH("/password", authHandler.ChangePassword)
		protected.POST("/refresh", authHandler.Refresh)
		protected.POST("/logout", authHandler.Logout)
		protected.PATCH("/me", userHandler.UpdateProfile)
		protected.PATCH("/me/image", userHandler.UpdateProfilePic)
		protected.GET("/me", userHandler.Me)
	}

	adminUserRoutes := r.Group("/api/v1/users")

	adminUserRoutes.Use(
		auth.AuthMiddleware(
			cfg.JWTSecret,
			cfg.AuthAccessCookie,
		),
		auth.RequireRoles(string(models.RoleAdmin)),
	)

	adminUserRoutes.POST("", userHandler.CreateUser)

	//--------------------------------------------------------------
	adminUserRoutes.GET("", userHandler.ListUsers)

	// List users.
	//
	// Pagination:
	// GET /api/v1/users?page=1&limit=20
	//
	// Filter by account status:
	// GET /api/v1/users?status=true
	// GET /api/v1/users?status=false
	//
	// Search across first name, last name, username, email,
	// alternate email, and phone:
	// GET /api/v1/users?search=rahul
	//
	// Filters can be combined:
	// GET /api/v1/users?page=1&limit=20&status=true&search=rahul

	//--------------------------------------------------------------

	adminUserRoutes.GET("/:id", userHandler.GetUserByID)
	adminUserRoutes.PATCH("/:id", userHandler.UpdateUserProfile)
	adminUserRoutes.PATCH("/:id/status", userHandler.UpdateUserStatus)
	adminUserRoutes.PATCH("/:id/password", userHandler.ChangeUserPassword)
	adminUserRoutes.PATCH("/:id/role", userHandler.UpdateRole)

	return r
}
