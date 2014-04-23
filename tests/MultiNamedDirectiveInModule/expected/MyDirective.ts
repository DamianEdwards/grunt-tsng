module MyApp.Area {
    //@NgDirective('foo')
    //@NgDirective('bar')
    class MyDirective implements ng.IDirective {
        public restrict = "A";

        public link(scope: any, element: ng.IAugmentedJQuery, attrs) {
            
        }
    }
}  