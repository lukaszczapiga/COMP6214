var visualisationsController = angular.module('visualisationsController', []);

indexController.controller('visualisationsCtrl', function ($scope,$timeout, openDataService){
    $scope.data = {};
    $scope.agencyData = [];
    $scope.showDetails = false;
    $scope.showCompare = false;
    $scope.agencyDetails = {};

    openDataService.getData().then(function(response){
        $scope.data = response.data;
        var prev =  $scope.data[1]['Agency Name'];
        var lifecycleTotalCosts = 0;
        var agencyTotalCosts = 0;
        var projectCount = 0;
        var agencyCount = 0;
        var projects = [];

        for(i=0; i<$scope.data.length; i++){
            projectCount++;
            var agency = {};
            var agencyName = $scope.data[i]['Agency Name'];

            if(agencyName !== prev ){
                agency.name = prev;
                agency.totalCosts = agencyTotalCosts;
                agency.lifecycleCosts = lifecycleTotalCosts;
                agency.projectCount = projectCount;
                agency.projects = projects;
                agency.id = agencyCount;
                agencyCount++;
                projects.push({
                    name: $scope.data[i]['Project Name'],
                    cost: $scope.data[i]['Projected/Actual Cost ($ M)'],
                    lifecycleCost: $scope.data[i]['Lifecycle Cost'],
                    startDate: $scope.data[i]['Start Date'],
                    endDate: $scope.data[i]['Projected/Actual Project Completion Date (B2)'],
                    costVariance :  $scope.data[i]['Cost Variance ($ M)'],
                    costVariancePercentage :  $scope.data[i]['Cost Variance (%)'],
                    scheduleVariance :  $scope.data[i]['Schedule Variance (in days)'],
                    scheduleVariancePercentage :  $scope.data[i]['Schedule Variance (%)']
                });
                $scope.agencyData.push(agency);


                projectCount = 0;
                lifecycleTotalCosts = 0;
                agencyTotalCosts = 0;
                projects = [];
            }else {
                lifecycleTotalCosts = lifecycleTotalCosts + $scope.data[i]['Lifecycle Cost'];
                agencyTotalCosts = agencyTotalCosts +  $scope.data[i]['Projected/Actual Cost ($ M)'];
                projects.push({
                    name: $scope.data[i]['Project Name'],
                    cost: $scope.data[i]['Projected/Actual Cost ($ M)'],
                    lifecycleCost: $scope.data[i]['Lifecycle Cost'],
                    startDate: $scope.data[i]['Start Date'],
                    endDate: $scope.data[i]['Projected/Actual Project Completion Date (B2)'],
                    costVariance :  $scope.data[i]['Cost Variance ($ M)'],
                    costVariancePercentage :  $scope.data[i]['Cost Variance (%)'],
                    scheduleVariance :  $scope.data[i]['Schedule Variance (in days)'],
                    scheduleVariancePercentage :  $scope.data[i]['Schedule Variance (%)']
                });
            }

            if(i === $scope.data.length-1)
            {
                agency.name = agencyName;
                agency.totalCosts = agencyTotalCosts;
                agency.lifecycleCosts = lifecycleTotalCosts;
                agency.projectCount = projectCount+1;
                agency.projects = projects;
                agency.id = agencyCount;
                agencyCount++;
                $scope.agencyData.push(agency);
            }

            prev = agencyName;
        }

        $scope.agencyData.sort(function(a, b){return b.totalCosts- a.totalCosts});

        var series = [{
            name: 'Agencies',
            colorByPoint: true,
            data: []
        }];

        var drilldown = {
            series: []
        };

        $scope.scatters = {};


        for(var i=0; i<$scope.agencyData.length; i++){
            agency = {};

            agency.name = $scope.agencyData[i].name;
            agency.y = $scope.agencyData[i].totalCosts;
            agency.drilldown = $scope.agencyData[i].name;

            series[0].data.push(agency);
            $scope.agencyData[i].projects.sort(function(a, b){return b.cost- a.cost});
            projects = [];

            /*$scope.scatters.push({
             name: $scope.agencyData[i].name,
             data: []
             });*/
            var indexId = $scope.agencyData[i].id;
            $scope.scatters[indexId] = {
                name: $scope.agencyData[i].name,
                data: []
            };
            for(z=0; z<$scope.agencyData[i].projects.length; z++){
                projects.push([$scope.agencyData[i].projects[z].name,$scope.agencyData[i].projects[z].cost]);
                $scope.scatters[indexId].data.push({
                    x: $scope.agencyData[i].projects[z].costVariancePercentage,
                    y: $scope.agencyData[i].projects[z].scheduleVariancePercentage,
                    name: $scope.agencyData[i].projects[z].name
                });
            }

            var agencyDrilldown = {};
            agencyDrilldown.name = $scope.agencyData[i].name;
            agencyDrilldown.id = $scope.agencyData[i].name;
            agencyDrilldown.data = projects.splice(0,10);

            drilldown.series.push(agencyDrilldown);
        }


        //This is not a highcharts object. It just looks a little like one!
        $scope.chartConfig = {

            options: {
                //This is the Main Highcharts chart config. Any Highchart options are valid here.
                //will be overriden by values specified below.
                chart: {
                    type: 'column',
                    height: 500,
                    events: {
                        drilldown: function (e) {
                            $scope.$apply(function () {
                                $scope.showDetails = true;
                                $scope.agencyIndex = e.point.index;

                                $scope.chartConfig.subtitle.text = e.point.name;
                                //$scope.agencyDetails = e.seriesOptions;
                                var projectsCopy = $scope.agencyData[$scope.agencyIndex].projects.slice();
                                $scope.rowCollectionProjects = projectsCopy.splice(0,10);

                                var agencyId = $scope.agencyData[$scope.agencyIndex].id;
                                $scope.scatterChartConfig.series[0].data = $scope.scatters[agencyId].data;
                                $scope.scatterChartConfig.series[0].name = $scope.scatters[agencyId].name;
                                $scope.scatterChartConfig.title.text = 'Cost Variance vs Schedule Variance of '+ $scope.scatters[agencyId].data.length +' Projects by Agency'
                            });
                        },
                        drillup: function (e) {
                            $scope.$apply(function () {
                                $scope.showDetails = false;
                                $scope.showCompare = false;
                                $scope.isAllProjects = false;
                            });
                        }
                    },
                    zoomType: 'x'
                },
                legend: {
                    enabled: false
                },
                plotOptions: {
                    series: {
                        borderWidth: 0,
                        dataLabels: {
                            enabled: true,
                            formatter: function () {
                                return Highcharts.numberFormat(this.y, 0, '.',',');
                            }
                        }
                    }
                },
                tooltip: {
                    headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                    pointFormatter:  function () {
                        return '<span style="color:'+this.color+'">'+this.name+'</span>: <b>'+Highcharts.numberFormat(this.y, 2, '.',',')+'</b> ($ M)<br/>';
                    }
                },
                drilldown: drilldown,
                credits: false
            },
            //The below properties are watched separately for changes.
            //Series object (optional) - a list of series using normal Highcharts series options.
            series: series,

            //Title configuration (optional)
            title: {
                text: 'US Government Projects\' Total Costs by Agency'
            },
            subtitle: {
                text: 'Click the columns to view the top 10 projects'
            },
            //Boolean to control showing loading status on chart (optional)
            //Could be a string if you want to show specific loading text.
            loading: false,
            //Configuration for the xAxis (optional). Currently only one x axis can be dynamically controlled.
            //properties currentMin and currentMax provided 2-way binding to the chart's maximum and minimum
            xAxis: {
                type: 'category',
                labels: {
                    rotation: -60,
                    style: {
                        fontSize: '12px',
                        fontFamily: 'Verdana, sans-serif'
                    }/*,
                    formatter: function() {
                        var res = this.value.split('Department of ');
                        if(res.length == 2)
                        {
                            return res[1];
                        }else{
                            return this.value;
                        }
                    }*/
                }
            },
            yAxis: {
                title: {
                    text: 'Total cost ($ M)'
                }

            }
        };

        $scope.predicatesAgency = ['Name', 'Project Count', 'Total Costs'];
        $scope.selectedPredicateAgency = $scope.predicatesAgency[0];
        $scope.rowCollectionAgency = $scope.agencyData;
        $scope.itemsByPageAgency = 5;

        $scope.wordsToCamelCase = function(str) {
            return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
                if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
                return index == 0 ? match.toLowerCase() : match.toUpperCase();
            });
        };

        $scope.predicatesProjects = ['Name', 'Total Costs'];
        $scope.selectedPredicateProjects = $scope.predicatesProjects[0];

        $scope.itemsByPageProjects = 10;

        $scope.scatterChartConfig = {
            options: {
                //This is the Main Highcharts chart config. Any Highchart options are valid here.
                //will be overriden by values specified below.
                chart: {
                    type: 'scatter',
                    zoomType: 'xy'
                },
                legend: {
                    layout: 'vertical',
                    floating: false,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                    borderWidth: 1
                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} %, {point.y} % {point.name}'
                        }
                    }
                },
                credits: false
            },
            //The below properties are watched separately for changes.
            //Series object (optional) - a list of series using normal Highcharts series options.
            series: //scatters[1]
             [{
                name: $scope.scatters[1].name,
                data: $scope.scatters[1].data
             }],
            //Title configuration (optional)
            title: {
                text: 'Cost Variance vs Schedule Variance of '+ $scope.scatters[1].data.length +' Projects by Agency'
            },
            //Boolean to control showing loading status on chart (optional)
            //Could be a string if you want to show specific loading text.
            loading: false,
            //Configuration for the xAxis (optional). Currently only one x axis can be dynamically controlled.
            //properties currentMin and currentMax provided 2-way binding to the chart's maximum and minimum
            xAxis: {
                title: {
                    enabled: true,
                    text: 'Cost Variance (%)'
                },
                startOnTick: true,
                endOnTick: true,
                showLastLabel: true
            },
            yAxis: {
                title: {
                    text: 'Schedule Variance (%)'
                }
            }
        };

    });

    $scope.isAllProjects = false;
    $scope.showAllProjects = function(index) {
        $scope.isAllProjects = true;
        $scope.rowCollectionProjects = $scope.agencyData[index].projects;
    };

    $scope.compare = [];

    $scope.selectRow = function(row){
        $scope.showCompare = true;
        $scope.attributes = [];
        $scope.compare.push(row);
        var temp = {};
        temp['name'] = 'Cost';
        temp['values'] = [];

        for(var i=0; i<$scope.compare.length; i++){
            temp['values'].push($scope.compare[i].cost);
        }
        $scope.attributes.push(temp);
    };

    $scope.resetCompare = function(){
        for(var i=0; i<$scope.compare.length; i++){
            $scope.compare[i].isSelected = false;
        }
        $scope.compare = [];
        $scope.attributes = [];
    };

    $scope.resetSelect = function(){
        $scope.scatterCompareSelect.selectOne = null;
        $scope.scatterCompareSelect.selectTwo = null;
        $scope.scatterCompareSelect.selectThree = null;
        var n = $scope.scatterChartConfig.series.length-1;
        $scope.scatterChartConfig.series.splice(1,n);

        selected = [];
        var agencyId = $scope.agencyData[$scope.agencyIndex].id;
        $scope.scatterChartConfig.title.text = 'Cost Variance vs Schedule Variance of '+ $scope.scatters[agencyId].data.length +' Projects by Agency'
    };

    var selected = [];

    $scope.scatterCompareSelect= {
        selectOne : null,
        selectTwo : null,
        selectThree : null
    };

    $scope.onChange = function(value, select){
        $scope.scatterChartConfig.title.text = 'Cost Variance vs Schedule Variance';
        if(select===1){
            selected[0] = value;
        }else if(select===2){
            selected[1] = value;
        }else if(select ===3){
            selected[2] = value;
        }

        for(var i=1; i<selected.length+1; i++)
        {
            $scope.scatterChartConfig.series[i] = {
                name: '',
                data: []
            };
            $scope.scatterChartConfig.series[i].data = $scope.scatters[selected[i-1]].data;
            $scope.scatterChartConfig.series[i].name = $scope.scatters[selected[i-1]].name;
        }

    };


});