# grunt-tsng v0.1.3

> A TypeScript pre-processor for AngularJS.


## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-tsng --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-tsng');
```


## Tsng task
_Run this task with the `grunt tsng` command._

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

This task will analyze the set of TypeScript files fed to it and, based on conventions and comment annotations found, will generate new TypeScript files containing the required AngularJS registration calls. This means you can concentrate on writing your application using typed constructs (modules, classes, interfaces, etc.) and not have to worry about wiring it up to AngularJS as explicit modules and dependencies defined using strings.

For example, you create a controller in a file called `MyController.ts` like this:
``` JavaScript
module MyApp {
  class MyController {
    constructor ($location: ng.ILocationService) {
      // Do stuff with $location here
      
    }
  }
}
```

and grunt-tsng will create a file called `MyController.ng.ts` like this:
``` JavaScript
/// <reference path="MyApp.ng.ts" />
module MyApp {
  angular.module("MyApp", [
    "$scope",
    MyController
  ]);
  
  class MyController {
    constructor ($location: ng.ILocationService) {
      // Do stuff with $location here
      
    }
  }
}
```

### Options

#### extension

Type: `string`
Default: `.ng.ts`

The file extension to use when generating the TypeScript files you'll eventually compile with the TypeScript compiler.


### Example usage
``` JavaScript
grunt.initConfig({
  tsng: {
    all: {
      src: ['app/*.ts', '!*.ng.ts'],
      dest: 'app'
    }
  }
});
```


### Supported conventions & annotations

Take a look at the [sample](https://github.com/DamianEdwards/grunt-tsng/tree/master/sample) for samples of usage.

To run the sample locally:
- Open a command prompt
- Clone this repo
- Change to the sample directory
- Run `npm install`
- Run `bower install`
- Run `grunt sample`

Grunt-tsng uses a number of conventions & comment annotations to discover the parts of your app you want to register with AngularJS. Comment annotations are simply a TS line comment followed by @ and the annotation name and any arguments in a method call fashion, e.g. `//@NgFilter('truncate')`

Grunt-tsng works best when the following conventions are followed:
- Each item you're creating is in its own file, i.e. one controller per file, one directive per file, etc.
- You use TypeScript constructs for organizing and building your app, e.g. put modules, use classes and interfaces to define your items.
- You compile your TypeScript to a single file per AngularJS app.
- You keep the TypeScript items internal to the modules they're defined in (don't export them). Interfaces for your services and models however should be exported so you can use them from other parts of your app.
- You use the [controller as](http://www.thinkster.io/angularjs/GmI3KetKo6/angularjs-experimental-controller-as-syntax) syntax for binding views to controllers.

#### Modules
TypeScript modules are tracked and mapped one-to-one with Angular modules. Each TypeScript module you declare will end up as an AngularJS module. To declare a module with dependencies, a config and/or run method, simply put the module in its own file with a `dependencies` array variable, configuration method and/or run method, e.g.:

``` JavaScript
module MyApp {
  var dependencies = [
    "ngRoute",
    AnotherModuleInMyApp
  ];
  
  function configuration($routeProvider: ng.IRouteProvider) {
    // Configure routes here
    
  }
}
```

Modules that are discovered but for which a dedicated file cannot be found will have a file created (in the configured dest directory) and any other file logically in that module will have a `/// <reference path="PathToModuleFile.ts" />` element added to the top of it.


#### Service dependencies
Function dependencies are discovered automatically for the various types (controllers, services, etc.) and included in the generated registration code. Dependency names starting with a '$' are assumed to be built-in AngularJS services and are included as specified, otherwise the dependency name is resolved against the services discovered in your app files.


#### Controllers & Services
Controllers and services are discovered by convention for class names ending in 'Controller' and 'Services' respectively. Dependencies are parsed according to the rules outlined above in Service dependencies.

Services that implement an interface will be registered with Angular using the full interface name rather than the service class name. This way you can inject them into your controllers by simply taking them as typed constructor arguments and the generated file will register the dependencies with Angular for you.

HomeController.ts:
``` JavaScript
module MyApp {
  class HomeController {
    constructor ($location: ng.ILocationService, aService: IAService) {
      
    }
  }
}
```

AService.ts:
``` JavaScript
module MyApp {
  export interface IAService {
    do(): string;
  }

  class AService implements IAService {
    constructor () {
      
    }
    
    public do() {
      return "Hello";
    }
  }
}
```

You can annotate a controller class with `//@NgController` to explicitly declare it, change its name, or even exclude it completely (this is useful in cases where you don't want to register the controller with Angular itself, e.g. when using the modal service from ui.bootstrap).
ModalController.ts:
``` JavaScript
module MyApp {
  //@NgController(skip=true)
  class ModalController {
    constructor ($location: ng.ILocationService) {
      
    }
  }
}
```

#### Directives
Description to come...

``` JavaScript
module MyApp {
    interface IPreventSubmitAttributes extends ng.IAttributes {
        name: string;
        appPreventSubmit: string;
    }

    //@NgDirective('appPreventSubmit')
    class PreventSubmitDirective implements ng.IDirective {
        private _preventSubmit: any;

        constructor() {
            this.link = this.link.bind(this);
        }

        public restrict = "A";

        public link(scope: any, element: ng.IAugmentedJQuery, attrs: IPreventSubmitAttributes) {
            element.submit(e => {
                if (scope.$eval(attrs.appPreventSubmit)) {
                    e.preventDefault();
                    return false;
                }
            });
        }
    }
}
```

#### Filters
Description to come...

``` JavaScript
module MyApp {
    //@NgFilter
    function truncate(input: string, length: number) {
        if (!input) {
            return input;
        }

        if (input.length <= length) {
            return input;
        } else {
            return input.substr(0, length).trim() + "…";
        }
    }
}
```


