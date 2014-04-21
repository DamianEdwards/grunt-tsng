module MyApp.Area {
    //@NgDirective('foo')
    //@NgDirective('bar')
    class MyDirective implements ng.IDirective {
        constructor() {
            this.link = this.link.bind(this);
        }

        public restrict = "A";

        public link(scope: any, element: ng.IAugmentedJQuery, attrs) {
            
        }
    }
}  