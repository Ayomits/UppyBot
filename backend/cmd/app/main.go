package main

import "api/internal/app"

// @title						Helper API
// @version						1.0
// @description					Helper bot API
// @securitydefinitions.apikey	ApiKeyAuth
// @in							header
// @name						Authorization
// @description					API Key authentication
// @host						localhost:8080
// @BasePath					/
func main() {
	app.Run()
}
