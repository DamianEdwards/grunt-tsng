/// <reference path="../bower_components/dt-angular/angular.d.ts" />
/// <reference path="../bower_components/dt-angular/angular-route.d.ts" />

module App.Sample {
    var dependencies = [
        "ngRoute",
        App.Sample.Hello,
        App.Sample.TitleCase,
        App.Sample.Greenify,
        App.Sample.Home
    ];

    function configuration($routeProvider: ng.route.IRouteProvider) {
        // Configure routes
        $routeProvider
            .when("/home", { templateUrl: "app/home/home.html" })
            .otherwise({ redirectTo: "/home" });
    }
}