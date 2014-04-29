module App.Sample.Greenify {
    
    //@NgDirective('appGreenify')
    class GreenifyDirective implements ng.IDirective {
        public restrict = "A";

        public link(scope: any, element: ng.IAugmentedJQuery) {
            element.css({ color: "#00aa00" });
        }
    }
}