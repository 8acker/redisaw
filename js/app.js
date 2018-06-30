const electronService = electron.remote.app;

function logChanged(watched, newVal, oldVal) {
    console.log(watched + " has been changed: " + oldVal + " => " + newVal);
}

var app = angular.module("RedisOperator", ["ngRoute", "ng.jsoneditor"]);

app.config(function ($routeProvider) {
    $routeProvider
        .when("/home", {
            templateUrl: "templates/home.html",
            controller: "homeController"
        })
        .when("/showall", {
            templateUrl: "templates/showall.html",
            controller: "showAllController",
            resolve: {
                title: function () {
                    return "Redis Operator";
                }
            }
        })
        .otherwise({redirectTo: "/showall"});
    electronService.httpedis.start();
});

app.controller("showAllController", ['$scope', '$http', function ($scope, $http) {
    $scope.obj = {options: {mode: "tree"}};
    $scope.title = electronService.title;
    $scope.stage = config.local.stage;
    $scope.host = config[$scope.stage].redis.host;
    $scope.hosts = config[$scope.stage].redis.hosts;
    $scope.stages = Object.keys(config);
    $scope.loading = false;

    $scope.$watch("stage", function (newValue, oldValue) {
        if (oldValue !== newValue) {
            logChanged("stage", newValue, oldValue);
            $scope.hosts = config[$scope.stage].redis.hosts;
            $scope.host = config[$scope.stage].redis.host;
            electronService.changed($scope.stage, $scope.host);
            $scope.fetchEntries();
        }
    });

    $scope.$watch("host", function (newValue, oldValue) {
        if (oldValue !== newValue) {
            logChanged("host", newValue, oldValue);
            electronService.changed($scope.stage, $scope.host);
            $scope.fetchEntries();
        }
    });

    $scope.$watch("select", function (newValue, oldValue) {
        if (oldValue !== newValue) {
            $scope.fetchEntries();
        }
    });

    $scope.fetchEntries = function () {
        if (!$scope.select) return;
        $scope.loading = true;
        const command = $scope.select.indexOf('*') > -1 ? "scan" : "get";
        const requestUrl = "http://127.0.0.1:7369/" + command + "/" + $scope.select + "?cursor=0&count=50";
        $http.get(requestUrl).then(function successCallback(response) {
            console.log("GET " + requestUrl);
            if (command === "get") {
                $scope.key = $scope.select;
                $scope.entry = response.data;
                $scope.obj = {data: $scope.entry, options: {mode: "code"}};
            } else {
                $scope.obj = {data: response.data, options: {mode: "code"}};
            }
            delete $scope.lastUpdate;
            $scope.loading = false;
        }, function errorCallback(err) {
            console.log(JSON.stringify(err));
            $scope.loading = false;
        });
    };

    $scope.updateEntry = function () {
        delete $scope.lastUpdate;
        if (!$scope.key) {
            $scope.lastUpdate = {status: "failed", key: $scope.key, error: new Error("No key provided")};
        } else if (!$scope.obj.data) {
            $scope.lastUpdate = {status: "failed", key: $scope.key, error: new Error("No payload provided")};
        } else if (!$scope.validateJSON($scope.obj.data)) {
            $scope.lastUpdate = {
                status: "failed",
                key: $scope.key,
                error: new Error("JSON input not valid or entry has not been changed")
            };
        } else {
            console.log("Updating key " + $scope.key + ": " + JSON.stringify($scope.obj.data));
            const requestUrl = "http://127.0.0.1:7369/set/" + $scope.key;
            $http.put(requestUrl, $scope.obj.data, {"Content-Type": "application/json"})
                .then(function successCallback(response) {
                    console.log(JSON.stringify(response, null, 2));
                    $scope.lastUpdate = {status: "succeeded", key: $scope.key, response: response};
                    $scope.fetchEntries();
                }, function errorCallback(err) {
                    console.log(JSON.stringify(err));
                    $scope.lastUpdate = {status: "failed", key: $scope.key, error: err};
                    $scope.loading = false;
                });
        }
    };

    $scope.validateJSON = function (data) {
        return JSON.stringify($scope.entry) !== JSON.stringify(data);
    };

    $scope.fetchEntries();
}]);


app.controller("homeController", function ($scope) {
    $scope.title = "Home";
});