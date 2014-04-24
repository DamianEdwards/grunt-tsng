module MyApp.Area {
    //@NgDirective('myDirective')
    class MyDirective implements ng.IDirective {
        private _aService: Area.IAService;

        constructor(aService: Area.IAService) {
            this._aService = aService;
        }

        public restrict = "A";

        public link(scope: any, element: ng.IAugmentedJQuery, attrs) {
            
        }
    }
}