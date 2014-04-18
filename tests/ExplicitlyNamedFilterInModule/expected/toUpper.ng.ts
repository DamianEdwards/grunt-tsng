/// <reference path="MyApp.Area.ng.ts" />

module MyApp.Area {

    //@NgFilter("toUpper")
    function upper(input: string) {
        return input.toUpperCase();
    }
    
    angular.module("MyApp.Area")
        .filter("toUpper", () => upper);
}