/// <reference path="MyApp.Area.ng.ts" />

module MyApp.Area {
    class MyController {
        private _aService: Area.IAService

        constructor (aService: Area.IAService) {
            this._aService = aService;
        }
    }
    
    angular.module("MyApp.Area")
        .controller("MyApp.Area.MyController", [
            "MyApp.Area.IAService",
            MyController
        ]);
}