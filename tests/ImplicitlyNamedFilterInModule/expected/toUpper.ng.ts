/// <reference path="MyApp.Area.ng.ts" />

module MyApp.Area {

    //@NgFilter
    function toUpper(input: string) {
        return input.toUpperCase();
    }
    
    angular.module("MyApp.Area")
        .filter("toUpper", () => toUpper);
}