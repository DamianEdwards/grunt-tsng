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
}