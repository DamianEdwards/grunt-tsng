/// <reference path="MyApp.Area.ng.ts" />

module MyApp.Area {
    export interface IAService {
        go(): string;
    }

    class AService implements IAService {
        constructor () {
            
        }

        public go() {
            return "Hello World";
        }
    }
    
    angular.module("MyApp.Area")
        .service("MyApp.Area.IAService", [
            AService
        ]);
}