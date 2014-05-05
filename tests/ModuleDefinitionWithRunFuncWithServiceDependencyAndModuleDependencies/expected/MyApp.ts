module MyApp {
    var dependencies = [
        Area
    ];

    function run($log: ng.ILogService, aService: Area.IAService) {
        $log.log(aService.go());
    }
}