module MyApp.Area {
    class MyController {
        private _aService: Area.IAService

        constructor (aService: Area.IAService) {
            this._aService = aService;
        }
    }
}