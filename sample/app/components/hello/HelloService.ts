module App.Sample.Hello {
    export interface IHelloService {
        sayHello(): string;
    }

    class HelloService implements IHelloService {
        public sayHello() {
            return "Hello from the HelloService service!";
        }
    }
}