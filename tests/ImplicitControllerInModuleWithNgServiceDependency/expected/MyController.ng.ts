/// <reference path="MyApp.Area.ng.ts" />

module MyApp.Area {
    class MyController {
        constructor ($location: ng.ILocationService) {
            
        }
    }
    
    angular.module("MyApp.Area")
        .controller("MyApp.Area.MyController", [
            "$location",
            MyController
        ]);
}