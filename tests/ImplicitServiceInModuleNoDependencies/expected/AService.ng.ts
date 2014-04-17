/// <reference path="MyApp.Area.ng.ts" />

module MyApp.Area {
    class AService {
        constructor () {
            
        }
    }
    
    angular.module("MyApp.Area")
        .service("MyApp.Area.AService", [
            AService
        ]);
}