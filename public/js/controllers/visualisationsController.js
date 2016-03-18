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
                var actualEndDate = $scope.data[i]['Projected/Actual Project Completion Date (B2)'];
                var plannedEndDate =  $scope.data[i]['Completion Date (B1)'];
                var scheduleVariance = $scope.data[i]['Schedule Variance (in days)'];
                var startDate = $scope.data[i]['Start Date'];

                /*if(actualEndDate==0){
                    if(scheduleVariance == 0){
                        actualEndDate = plannedEndDate;
                    }else{
                        actualEndDate = plannedEndDate + scheduleVariance;
                    }
                }*/
                projects.push({
                    name: $scope.data[i]['Project Name'],
                    cost: $scope.data[i]['Projected/Actual Cost ($ M)'],
                    lifecycleCost: $scope.data[i]['Lifecycle Cost'],
                    startDate: startDate,
                    plannedEndDate: plannedEndDate,
                    endDate: actualEndDate,
                    costVariance :  $scope.data[i]['Cost Variance ($ M)'],
                    costVariancePercentage :  $scope.data[i]['Cost Variance (%)'],
                    scheduleVariance :  scheduleVariance,
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

        var drilldown = {
            series: []
        };

        var projectsSeries = [];

        $scope.scatters = {};

        var series = [{
            name: 'Agencies',
            colorByPoint: true,
            data: [],
            type: 'column',
            tooltip: {
                headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                pointFormatter:  function () {
                    return '<span style="color:'+this.color+'">'+this.name+'</span>: <b>'+Highcharts.numberFormat(this.y, 2, '.',',')+'</b> ($ M)<br/>';
                }
            }
        }];

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

            var numberOfProjects = $scope.agencyData[i].projects.length;
            projectsSeries.push(numberOfProjects);

            for(var z=0; z<numberOfProjects; z++){
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
            agencyDrilldown.type = 'column';

            drilldown.series.push(agencyDrilldown);
        }

        series.push({
            name: 'Projects',
            data: projectsSeries,
            type: 'spline',
            yAxis: 1,
            marker: {
                enabled: false
            },
            dataLabels: {
                enabled: false
            },
            //enableMouseTracking: false,
            color: '#00004d',
            tooltip: {
                pointFormatter: function () {
                    return 'No. projects: ' + this.y;
                }
            }
        });


        //This is not a highcharts object. It just looks a little like one!
        $scope.chartConfig = {

            options: {
                //This is the Main Highcharts chart config. Any Highchart options are valid here.
                //will be overriden by values specified below.
                chart: {
                    height: 500,
                    events: {
                        drilldown: function (e) {
                            $scope.$apply(function () {
                                $scope.showDetails = true;
                                $scope.agencyIndex = e.point.index;
                                $scope.chartConfig.title.text = e.point.name;
                                $scope.chartConfig.subtitle.text = 'Top 10 projects';

                                $scope.compareSelects = $scope.agencyData.slice();
                                $scope.compareSelects.splice($scope.agencyIndex,1);

                                var projectsCopy = $scope.agencyData[$scope.agencyIndex].projects.slice();
                                $scope.rowCollectionProjects = projectsCopy.splice(0,10);

                                var agencyId = $scope.agencyData[$scope.agencyIndex].id;
                                $scope.scatterChartConfig.series[0].data = $scope.scatters[agencyId].data;
                                $scope.scatterChartConfig.series[0].name = $scope.scatters[agencyId].name;
                                $scope.scatterChartConfig.title.text = 'Cost Variance vs Schedule Variance of '+ $scope.scatters[agencyId].data.length +' Projects by Agency';

                                $scope.selectModel1 =  $scope.compareSelects.slice();
                                $scope.selectModel2 =  $scope.compareSelects.slice();
                                $scope.selectModel3 =  $scope.compareSelects.slice();
                            });
                        },
                        drillup: function (e) {
                            $scope.$apply(function () {
                                $scope.showDetails = false;
                                $scope.showCompare = false;
                                $scope.isAllProjects = false;
                                $scope.chartConfig.title.text = 'US Government Projects\' Total Costs and Projects Count by Agency';
                                $scope.chartConfig.subtitle.text = 'Click the agency name to view the top 10 projects'
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
                    },
                    shared: true
                },
                drilldown: drilldown,
                credits: false
            },
            //The below properties are watched separately for changes.
            //Series object (optional) - a list of series using normal Highcharts series options.
            series: series,
            //Title configuration (optional)
            title: {
                text: 'US Government Projects\' Total Costs and Projects Count by Agency'
            },
            subtitle: {
                text: 'Click the agency name to view the top 10 projects'
            },
            //Boolean to control showing loading status on chart (optional)
            //Could be a string if you want to show specific loading text.
            loading: false,
            //Configuration for the xAxis (optional). Currently only one x axis can be dynamically controlled.
            //properties currentMin and currentMax provided 2-way binding to the chart's maximum and minimum
            xAxis: {
                type: 'category',
                crosshair: true,
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
            yAxis: [{
                title: {
                    text: 'Total cost ($ M)'
                }

            },{
                title: {
                    text: 'Total number of projects'
                },
                opposite: true
            }]
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
                            pointFormat: '{point.name} <br> Cost variance: {point.x} % <br> Schedule variance: {point.y} %'
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
        var temp2 = {};
        var temp3 = {};
        var temp4 = {};
        var temp5 = {};
        var temp6 = {};

        temp['name'] = 'Total Costs ($ M)';
        temp['values'] = [];
        temp2['name'] = 'Start Date';
        temp2['values'] =  [];

        temp3['name'] = 'Lifecycle Costs ($ M)';
        temp3['values'] = [];
        temp4['name'] = 'Cost Variance ($ M)';
        temp4['values'] =  [];
        temp5['name'] = 'Schedule Variance (days)';
        temp5['values'] = [];
        temp6['name'] = 'End Date';
        temp6['values'] =  [];


        temp['filter'] = 'currency';
        temp2['filter'] = 'date';
        temp3['filter'] = 'currency';
        temp4['filter'] = 'currency';
        temp5['filter'] = 'number';

        temp6['filter'] = 'date';

        for(var i=0; i<$scope.compare.length; i++){
            temp['values'].push($scope.compare[i].cost);
            temp2['values'].push($scope.compare[i].startDate);
            temp3['values'].push($scope.compare[i].lifecycleCost);
            temp4['values'].push($scope.compare[i].costVariance);
            temp5['values'].push($scope.compare[i].scheduleVariance);
            temp6['values'].push($scope.compare[i].plannedEndDate);
        }
        $scope.attributes.push(temp);
        $scope.attributes.push(temp3);
        $scope.attributes.push(temp4);
        $scope.attributes.push(temp5);

        $scope.attributes.push(temp2);
        $scope.attributes.push(temp6);

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


    var temp1 = {};
    var temp2 = {};
    var temp3 = {};
    var prevIndex1 = [];
    var prevIndex2 = [];
    var prevIndex3 = [];

    $scope.disabled = {
        two: true,
        three: true
    };

    $scope.onChange = function(value, select){
        $scope.scatterChartConfig.title.text = 'Cost Variance vs Schedule Variance';

        if(select===1){
            $scope.disabled.two = false;
            selected[0] = value.id;
            if(prevIndex1.length > 0){
                $scope.selectModel2.splice(prevIndex1[0],0, temp1);
                $scope.selectModel3.splice(prevIndex1[1],0, temp1);
            }
            var index2 = $scope.selectModel2.indexOf( $scope.scatterCompareSelect.selectOne );
            var index3 = $scope.selectModel3.indexOf( $scope.scatterCompareSelect.selectOne );
            $scope.selectModel2.splice(index2,1)[0];
            temp1 = $scope.selectModel3.splice(index3,1)[0];
            prevIndex1[0] = index2;
            prevIndex1[1] = index3;
        }else if(select===2){
            $scope.disabled.three = false;
            selected[1] = value.id;
            if(prevIndex2.length > 0){
                $scope.selectModel1.splice(prevIndex2[0],0, temp2);
                $scope.selectModel3.splice(prevIndex2[1],0, temp2);
            }
            var index1 = $scope.selectModel1.indexOf( $scope.scatterCompareSelect.selectTwo );
            var index3 = $scope.selectModel3.indexOf( $scope.scatterCompareSelect.selectTwo );
            $scope.selectModel1.splice(index1,1);
            temp2 = $scope.selectModel3.splice(index3,1)[0];
            prevIndex2[0] = index1;
            prevIndex2[1] = index3;
        }else if(select ===3){
            selected[2] = value.id;
            if(prevIndex3.length > 0){
                $scope.selectModel1.splice(prevIndex3[0],0, temp3);
                $scope.selectModel2.splice(prevIndex3[1],0, temp3);
            }
            var index1 = $scope.selectModel1.indexOf( $scope.scatterCompareSelect.selectThree );
            var index2 = $scope.selectModel2.indexOf( $scope.scatterCompareSelect.selectThree );
            $scope.selectModel1.splice(index1,1);
            temp3 = $scope.selectModel2.splice(index2,1)[0];
            prevIndex3[0] = index1;
            prevIndex3[1] = index2;
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


}).filter('useFilter', function($filter) {
    return function(value, filterName) {
        return $filter(filterName)(value);
    };
});