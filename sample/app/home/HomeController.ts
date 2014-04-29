module App.Sample.Home {
    interface IHelloViewModel {
        message: string;
    }

    class HomeController implements IHelloViewModel {
        constructor(helloService: Hello.IHelloService) {
            this.message = helloService.sayHello();
        }

        public message: string;
    }
}