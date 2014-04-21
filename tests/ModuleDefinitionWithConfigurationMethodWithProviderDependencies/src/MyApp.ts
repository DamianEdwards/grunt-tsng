module MyApp {
    function configuration($routeProvider: ng.route.IRouteProvider, $logProvider: ng.ILogProvider) {
        $logProvider.debugEnabled(true);
        
        $routeProvider
            .when("/", { templateUrl: "tmpl/home.html" })
            .otherwise({ redirectTo: "/" });
    }
}