function getMapController(){

  var mapController = ({
    trajectryFolder : "../Dynamic\ Data/",
    map : null,
    heatmap : null,
    markers : [],
    stopDrawing: false,
    last_drawn_point: -1,
    trajectory_points: null,
    drawingInterval : 50,
    drawing_speed : 1,
    currentTime : 0,
    ABMDrawing : false,
    // warning : {
    //   path: google.maps.SymbolPath.CIRCLE,
    //   fillColor: '#',
    //   fillOpacity: .4,
    //   scale: 6,
    //   strokeColor: 'white',
    //   strokeWeight: 1
    // },
    // up : {
    //   path: google.maps.SymbolPath.CIRCLE,
    //   fillColor: 'green',
    //   fillOpacity: .4,
    //   scale: 10,
    //   strokeColor: 'white',
    //   strokeWeight: 1
    // },
    origin_marker : null,

    end_marker: null,
     
    draw_item : "trajectory_point",

    color_array : ["#008000","#0D8000", "#518000","#804400", "#804000", "#802F00","#802D00", "#802B00","#802900", "#802800", "#802500","#802400","#802200","#802000", "#801E00", "#801C00","#801A00","#801500","#801300","#801100","#800D00", "#800400","#800000"],
    
    color_endpoint : "red",

    gradient :[
      "rgba(102, 255, 0, 0)",
      "rgba(102, 255, 0, 1)",
      "rgba(147, 255, 0, 1)",
      "rgba(193, 255, 0, 1)",
      "rgba(238, 255, 0, 1)",
      "rgba(244, 227, 0, 1)",

      "rgba(249, 198, 0, 1)",
      "rgba(255, 170, 0, 1)",
      "rgba(255, 150, 0, 1)",
      "rgba(255, 113, 0, 1)",
      "rgba(255, 80, 0, 1)",
      "rgba(255, 57, 0, 1)",
      "rgba(255, 20, 0, 1)",
       "rgba(255, 0, 0, 1)"
    ],

    setIsABMDrawing : function (is_abm_drawing) {
      this.ABMDrawing = is_abm_drawing;
    },


    initMap : function(){
      var myLatlng = new google.maps.LatLng(1.2,103.8);
      var mapOptions = {
              zoom: 11,
              center: myLatlng
      };
      this.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

      google.maps.event.addListener(this.map, 'click', function( event ){
        //console.log( "Latitude: "+event.latLng.lat()+" "+", longitude: "+event.latLng.lng() ); 
      });
    },

    initialize : function() {
      this.initMap();
    },

    addHeatmapLayer : function(){
      //console.log("inside addHeatmapLayer"); // TODO: if toggle a csv heatmap and then, toggle a txt heatmap, -> bug. CHECK!
      this.heatmap = new google.maps.visualization.HeatmapLayer({
        data: this.getTrajectoryPoints(),
        map: this.map
      });
      //console.log("heat map is defined!");
      this.heatmap.set('gradient',this.gradient);
      // this.heatmap.set('radius', 20);
      this.heatmap.set('opacity', 0.9);
      this.heatmap.set('maxIntensity', 600.0);
      // this.changeGradient();
      //console.log(this.heatmap);
      //console.log(this.heatmap.get('gradient'));
    },

    addOriginMarker : function(){
      var origin_marker = new google.maps.Marker({
          position: this.map.getCenter(),
          label: "O",
          map: this.map,
          title: this.map.getCenter().toString(),
          draggable: true
      });
      origin_marker.addListener('dragend', function(event) {
          //console.log("event:", event);
          //console.log(origin_marker.getPosition().lat());
          //console.log(origin_marker.getPosition().lng());
          origin_marker.setTitle(origin_marker.getPosition().toString());
        });
      this.origin_marker = origin_marker;
    },

    addEndMarker: function(){
      //console.log("in add end marker");
      var end_marker = new google.maps.Marker({
          position: this.map.getCenter(),
          label: "E",
          map: this.map,
          title: this.map.getCenter().toString(),
          draggable: true
      });
      end_marker.addListener('dragend', function(event) {
          //console.log("event:", event);
          //console.log(end_marker.getPosition().lat());
          //console.log(end_marker.getPosition().lng());
          end_marker.setTitle(end_marker.getPosition().toString());
        });
      this.end_marker = end_marker;
    },

    calculateOriginEndDistance : function(){
      if(this.end_marker != null && this.origin_marker!=null){
        dx_dy_obj = this.LatLonToXY(this.origin_marker.getPosition().lat(), this.origin_marker.getPosition().lng(), this.end_marker.getPosition().lat(), this.end_marker.getPosition().lng());
        //console.log(dx_dy_obj);
        var distance = Math.sqrt(Math.pow(dx_dy_obj.dx,2) + Math.pow(dx_dy_obj.dy,2));
        alert("Distance is: " + distance + " km");
      }
    },

    LatLonToXY : function(lat1,lon1,lat2, lon2){
      //console.log(lat1, lon1, lat2, lon2);
      var dx = (lon2-lon1)*40000*Math.cos((lat1+lat2)*Math.PI/360)/360
      var dy = (lat1-lat2)*40000/360
      return {dx:dx, dy:dy};
    },

    changeGradient: function () {
      var gradient = [
        'rgba(0, 255, 255, 0)',
        'rgba(0, 255, 255, 1)',
        'rgba(0, 191, 255, 1)',
        'rgba(0, 127, 255, 1)',
        'rgba(0, 63, 255, 1)',
        'rgba(0, 0, 255, 1)',
        'rgba(0, 0, 223, 1)',
        'rgba(0, 0, 191, 1)',
        'rgba(0, 0, 159, 1)',
        'rgba(0, 0, 127, 1)',
        'rgba(63, 0, 91, 1)',
        'rgba(127, 0, 63, 1)',
        'rgba(191, 0, 31, 1)',
        'rgba(255, 0, 0, 1)'
      ]
      this.heatmap.set('gradient', this.heatmap.get('gradient') ? null : gradient);
    },


    toggleHeatmap : function() {
      this.heatmap.setMap(this.heatmap.getMap() ? null : this.map);
    },

    getTrajectoryPoints : function(){
      points = [];
      for (var i = 0 ; i< this.trajectory_points.length;i++){
        points.push( new google.maps.LatLng(this.trajectory_points[i].latitude, this.trajectory_points[i].longitude));
        // points.push( parseFloat(new google.maps.LatLng(this.trajectory_points[i].latitude), parseFloat(this.trajectory_points[i].longitude)));
      }

      //console.log("points.length:",points.length);
      //console.log("points:", points)
      return points;
    },


    loadTrajectory1 : function (){
      // console.log("in loadTrajectory1");
      // point = {
        // latitude:"1.20075", 
        // longitude:"103.834683333"
      // }
      // this.drawSingelTrajectoryPoint(point)
      var self = this;
      this.loadTrajectory(this.trajectryFolder + "tankers/cleanedData/aggregateData.csv",function(trajectory_points){
        //console.log("self.trajectory_points:", self.trajectory_points);
        //console.log("finish loading");
        alert("loading finished");
        // self.drawTrajectoryAsPoints(trajectory_points, 0);
      })

    },

    pauseLoading : function(){
      this.stopDrawing = true;
    },

    restartLoading : function(finished_plotting_callback){
      var self = this;
      //console.log("restart laoding, self.last_drawn_point:", self.last_drawn_point);
      self.stopDrawing = false;
      self.drawTrajectoryAsPoints(self.trajectory_points, self.last_drawn_point + 1, finished_plotting_callback)
    },

    loadTrajectory : function(filename, callback){
      var self = this;
      $.ajax({
        type: "GET",
        url: filename,
        dataType: "text",
        success: function(data) {
          trajectoryData = self.processData(data)
          self.trajectory_points = trajectoryData
          callback(trajectoryData);
        },
        error:function(){ 
          alert("file not found, please check input");
        }
     });
    },

    processData: function(allText) {
      var allTextLines = allText.split(/\r\n|\n/);
      var headers = allTextLines[0].split(',');
      var lines = [];

      for (var i=1; i<allTextLines.length; i++) {
          var data = allTextLines[i].split(',');
          if (data.length == headers.length) {

              var tarr = {};
              for (var j=0; j<headers.length; j++) {
                  tarr[headers[j]] = data[j];
              }
              lines.push(tarr);
          }
      }
      // console.log(lines);
      return lines
    },

    processTxtData: function(allText){
      var allTextLines = allText.split(/\r\n|\n/);
      var i = 0;
      var own="own";
      if(allTextLines[0]=="own") {
        own = "own";
        i++;
      } else if(allTextLines[0] == "ownInit") {
        own = "ownInit";
        i++;
      } else { own = "other";}
      
      var lines = [];
      for (; i<allTextLines.length-1; i++) {
          var data = allTextLines[i].split(/ |\t/);
          var tarr = {};
          tarr['longitude'] = data[data.length-4];
          tarr['latitude'] = data[data.length-3];
          tarr['course'] = data[data.length-2];
          tarr['time'] = data[data.length-1];
          tarr['vessel'] = own;
          if (data.length >= 6) { // has more fields
            tarr['pattern_id'] = data[data.length - 6]
            tarr['on_pattern_pos'] = data[data.length - 5]
          }
          lines.push(tarr);
      }
      // console.log(lines);
      return lines
    },

    drawTrajectoryAsPoints : function (trajectory_points, index, finished_plotting_callback){
        var self = this;
        if(self.stopDrawing){
          //console.log("plotted point:", self.last_drawn_point, "/",trajectory_points.length);
          //console.log("paused");
          return;
        }
        if(index >= trajectory_points.length) {
          //console.log("finish plotting");
          finished_plotting_callback()
          return;
        }

        if (self.ABMDrawing) {
          var point;
          //alert("OwnTime: "+Number(trajectory_points[index].time) + "CurrTime: " +this.currentTime);
          for( var i = 0; i<self.markers.length; i++) {
            if(self.markers[i].time < self.currentTime) {
              if(self.markers[i].vessel != "own" && self.markers[i].vessel != "ownInit" && 
                self.markers[i].time < self.currentTime) {
                // self.markers[i].markk.setMap(null);
              }
              //self.markers[i].markk.setOpacity(Math.max(self.markers[i].markk.getOpacity()*0.8, 0.1));
            }
          }

          num_vessels = 0;
          updated_vessels = 0;
          //console.log("before new plotting of a set of points, self.markers.length:", self.markers.length);
          while(index < trajectory_points.length && 
            Number(trajectory_points[index].time) == self.currentTime) {
            point = trajectory_points[index];
            //console.log("points at same time:", point.longitude + ":" + point.latitude + ":" + point.time + ":" + point.vessel);
            if (self.currentTime == 0) { 
              // first run, get the total number of vessels (i.e., having same time stamps)
              // or if this run, number of vessels increase
              self.drawSingelTrajectoryPoint(trajectory_points[index]);
              num_vessels ++;
            }
            else if (num_vessels >= self.markers.length) {
              self.drawSingelTrajectoryPoint(trajectory_points[index]);
              num_vessels ++; 
              updated_vessels ++;
            }
            else {
              //console.log("markers to update:", self.markers[num_vessels]);
              self.markers[num_vessels].markk.setVisible(true);
              self.markers[num_vessels].time = self.currentTime;
              self.markers[num_vessels].vessel = point.vessel;
              self.markers[num_vessels].course = point.course;
              self.updateSingleTrajectoryPointMarker(self.markers[num_vessels].markk, point);
              num_vessels ++;
              updated_vessels ++;
            }
            
            self.last_drawn_point = index;
            index++;
            $("#TimeDisplay").text("Time Display: " + self.currentTime);
          }

          while(self.currentTime != 0 && updated_vessels < self.markers.length) { // if number of vessels decrease at this timestamp
            self.markers[updated_vessels].markk.setVisible(false);
            updated_vessels ++;
          }

          //console.log("end of drawing for points before:", self.currentTime);
          
          self.currentTime++;
          window.setTimeout(function(){
            self.drawTrajectoryAsPoints(trajectory_points,index, finished_plotting_callback)
          }, self.drawingInterval / self.drawing_speed);  

        }
        else {
          self.drawSingelTrajectoryPoint(trajectory_points[index]);
          self.last_drawn_point = index
          
          window.setTimeout(function(){
            self.drawTrajectoryAsPoints(trajectory_points,index + 1, finished_plotting_callback)
          }, self.drawingInterval / self.drawing_speed);  
        }
    },

    updateSingleTrajectoryPointMarker : function (marker, new_point) {
      // console.log("new_point.course:", new_point.course);
      // update marker properties, position and course
      var newLatLng = new google.maps.LatLng(new_point.latitude, new_point.longitude);
      marker.setPosition(newLatLng);

      var cID = 1;
        if(new_point.vessel == "own") {
          cID = 3;
        } else if(new_point.vessel == "ownInit") {
          cID = 5;
        } else {
          cID = 1;
        }
      var image={
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          //url: "http://localhost/~jimxing/vessel_trajectory_visualizer/imgs/vessel1.png",

          // size: new google.maps.Size(20, 32),
          // // The origin for this image is (0, 0).
          // origin: new google.maps.Point(0, 0),
          // // The anchor for this image is the base of the flagpole at (0, 32).
          // anchor: new google.maps.Point(0, 32),

          fillColor:this.color_array[cID],
          fillOpacity: 1,
          scale: 3,
          strokeColor: 'black',
          strokeWeight: 0.5,
          rotation: Number(new_point.course),
      };

      marker.setIcon(image);

      // update title
      var myLatlng = new google.maps.LatLng(new_point.latitude,new_point.longitude); 
            // console.log(myLatlng)
            // console.log(myLatlng.lat());
            // console.log(myLatlng.lng());
      var str_suffix = "";
      if (new_point.on_pattern_pos) {
        str_suffix += ";on_pattern_pos:" + new_point.on_pattern_pos;
      }
      if(new_point.pattern_id) {
       str_suffix += ";pattern_id:" + new_point.pattern_id; 
      }
      marker.setTitle(myLatlng.toString() + str_suffix);
      
    },

    drawSingelTrajectoryPoint : function (point){
      var self = this;
      //console.log("drawSingelTrajectoryPoint:", point);
      if (self.ABMDrawing) {
        console.log("is_abm_drawing, point:", point);
        var cID = 1;
        if(point.vessel == "own") {
          cID = 3;
        } else if(point.vessel == "ownInit") {
          cID = 5;
        } else {
          cID = 1;
        }
          var image={
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          fillColor:this.color_array[cID],
          fillOpacity: 1,
          scale: 3,
          strokeColor: 'black',
          strokeWeight: 0.5,
          rotation: Number(point.course)
          };

          var shape = {
            coords: [1, 1, 1, 20, 18, 20, 18, 1],
            type: 'poly'
          };

            var myLatlng = new google.maps.LatLng(point.latitude,point.longitude); 
            // console.log(myLatlng)
            // console.log(myLatlng.lat());
            // console.log(myLatlng.lng());
            var str_suffix = "";
            if (point.on_pattern_pos) {
              str_suffix += ";on_pattern_pos:" + point.on_pattern_pos;
            }
            if(point.pattern_id) {
             str_suffix += ";pattern_id:" + point.pattern_id; 
            }

            var marker = new google.maps.Marker({
                position: myLatlng,
                map: this.map,
                title: myLatlng.toString() + str_suffix,
                icon: image,
                shape: shape,
                opacity: 1,
                rotation: Number(point.course)
            });
            var mark={};
          mark['time']=point.time;
          mark['markk']=marker;
          mark['course']=point.course;
          mark['vessel'] = point.vessel;
          console.log("Drawing:" + point.longitude + ":" + point.latitude + ":" + point.time + ":" + point.vessel);
          this.markers.push(mark);
      }
      else {
      var image = null;
      if(this.draw_item == "end_point"){
         image={
              path: 'M -2,0 0,-2 2,0 0,2 z',
              // fillColor:this.color_array[0],
              fillColor:this.color_endpoint,
              fillOpacity: 1,
              scale: 3,
              strokeColor: 'white',
              strokeWeight: 0
          }; 
      }
      else{
      image={
           path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
           fillColor:this.color_array[0],
           fillOpacity: 0.3,
           scale: 3,
           strokeColor: 'white',
           strokeWeight: 0,
           rotation:  Number(point.course_over_ground/10.0)
        };
      }
       

      var myLatlng = new google.maps.LatLng(point.latitude,point.longitude); 
      // console.log(myLatlng)
      // console.log(myLatlng.lat());
      // console.log(myLatlng.lng());

      var marker = new google.maps.Marker({
          position: myLatlng,
          map: this.map,
          title: myLatlng.toString() + " , " + point.ts_string + ", index:" + (self.last_drawn_point + 1),
          icon:image,
      });
            
      // update drawing speed
      if (typeof(point.speed_over_ground) !== "undefined") {
        if (point.speed_over_ground == 0) {
           self.drawing_speed = 0.1
        }
        else {
          self.drawing_speed = point.speed_over_ground
        }
      }
                  
      this.markers.push(marker);

      }
     
    },

    setAllMap : function (map) {
          for (var i = 0; i < this.markers.length; i++) {
            if(this.ABMDrawing) {
              this.markers[i].markk.setMap(map);  
            }
            else {
              this.markers[i].setMap(map);
            }
            
          }
    },
      
    hideMarkers : function () {
          this.setAllMap(null);
    },
      

    deleteMarkers : function () {
            this.hideMarkers();
            this.markers = [];
    },
      
      // Shows any markers currently in the array.
    showMarkers : function () {
        this.setAllMap(this.map);
    },

    cleanPreviousData : function(ask_confirmation){
      console.log("cleanPreviousData!")
      this.currentTime = 0; // for ABM drawing
      if(this.heatmap !=null){
        this.heatmap.setMap(null);// remove from current map 
        this.heatmap = null; // set to null again
      }
      if(this.last_drawn_point != -1){
        this.last_drawn_point = -1
      }
      if(this.stopDrawing != false){
        this.stopDrawing = false
      }
      if (ask_confirmation){
        var confirm_delete_markers = confirm("Do you want to delete existing markers?");
        if(confirm_delete_markers == true){
          this.deleteMarkers();  
        }  
      }
      else {
        this.deleteMarkers();
      }
      
    },
    setDrawingInterval: function (interval){
      this.drawingInterval = interval;
    }

  });

  return mapController;
}




$(document).ready(function(){

  myMapController = getMapController();;
  google.maps.event.addDomListener(window, 'load', function(){
    myMapController.initialize();
  });

  var myslider = $('.slider').slider({
    formater: function(value) {
      return "drawing interval:"+value;
    }
  });
  myMapController.setDrawingInterval($('#myslider').val());
  $('.slider').on('slideStop', function(){
    myMapController.setDrawingInterval($('#myslider').val());
  });
  

  $("#loadTrajectory1").click(function(){
    myMapController.loadTrajectory1();
  });

  $("#clearTrajectory").click(function(){
    myMapController.deleteMarkers();
    myMapController.last_drawn_point = -1; // reset the starting point
    myMapController.currentTime = 0; // reset time for ABM drawing
    $("#TimeDisplay").text("Time Display: " + myMapController.currentTime);
  });

  $("#placeOriginMarker").click(function(){
    myMapController.addOriginMarker();
  });

  $("#placeEndMarker").click(function(){
    myMapController.addEndMarker();
  });

  $("#calOriginEndDistance").click(function(){
    myMapController.calculateOriginEndDistance();
  });

  
  $("#pauseStartDrawing").click(function(){
    var text = $("#pauseStartDrawing").text();
    if(text == "StartPlotting"){
      $("#pauseStartDrawing").text("PausePlotting");
      myMapController.restartLoading(function () {
        console.log("finished from button press!")
      });
    }
    else if(text == "PausePlotting"){
      $("#pauseStartDrawing").text("ResumePlotting");
      myMapController.pauseLoading();
    }
    else if(text == "ResumePlotting"){
     $("#pauseStartDrawing").text("PausePlotting") ;
     myMapController.restartLoading(function(){
      console.log("finished from button press!")
     });
    }
  })

  $("#ToggleHeatMap").click(function(){
    if(myMapController.trajectory_points == null){
      alert("Please load a trajectory file first!");
    }
    else if(myMapController.heatmap == null){
      console.log("heatmap is not yet initiated");
      myMapController.addHeatmapLayer();
    }
    else{
      console.log("should call toggleHeatmap");
      myMapController.toggleHeatmap();
    }
  })

  $("#loadFile").click(function(){
    var filename = $("#loadFileText").val();
    if(filename == ""){
      alert("please input a filename");
      return false;
    }
    myMapController.loadTrajectory(myMapController.trajectryFolder + filename,function(trajectory_points){
      console.log("self.trajectory_points:", myMapController.trajectory_points);
      console.log("finish loading");
      alert("loading finished");
      //clean the storage associated with previous set of data
      myMapController.cleanPreviousData(true);
    });
    return false;
  });

  $("#uploadButton").click(function(){
    $('#uploadFile').click();
  });

  $('#uploadFile').change(function(){
    console.log("trying to upload new file");
    var files = document.getElementById('uploadFile').files;
    console.log(files);
    if (files.length == 1) {
      loadFileContentWorker(myMapController, files[0], true, function() {
        console.log("load finished callback, 1 file load case")
      });
    }
    else {
      all_txt_files_flag = true
      for (var i = 0; i < files.length; i++) {
        if (files[i].name.indexOf('.txt') == -1) {
          all_txt_files_flag = false
        }
      }

      if (all_txt_files_flag) {
        for (var i = 0; i < files.length ; i++) {
          loadFileContentWorker(myMapController, files[i], true, function() {
            console.log("load finished callback, mutiple txt case");
          });
        }
      }
      else {
        myMapController.markers = []; // PURPOSE for DEBUGGING PURPOSE
        conseutiveLoadFileContentWorker(myMapController, 0, files);
      }
    }
  });


})

function conseutiveLoadFileContentWorker(myMapController, i, files) {
  $('#current_trajectory_id').text("Current Trajectory: " + i);
  if (i < files.length) {
    loadFileContentWorker(myMapController, files[i], true, function(){
      myMapController.restartLoading(function(){
          conseutiveLoadFileContentWorker(myMapController, i + 1, files);
      });  
    })
  }
  else {
    console.log("finished plotting all consecutive trajectories!");
  }
}


function loadFileContentWorker(myMapController, this_file, ask_confirmation, load_finished_callback) {
  if(this_file.name.indexOf('.csv') != -1) {
    var csv_reader = new FileReader();
    if(this_file.name.indexOf('endpoints') != -1) {
      myMapController.draw_item = "end_point";
    }
    else{
      myMapController.draw_item = "trajectory_point"; 
    }

    csv_reader.onload = function(e) {
      var contents = e.target.result;
      trajectoryData = myMapController.processData(contents)
      myMapController.trajectory_points = trajectoryData
      // myMapController.trajectory_points = trajectoryData.slice(0,1)
      console.log("self.trajectory_points:", myMapController.trajectory_points);
      console.log("finish loading");
      if (ask_confirmation) {
        alert("loading finished");
      }

      myMapController.cleanPreviousData(ask_confirmation);
      myMapController.setIsABMDrawing(false);
      load_finished_callback()
    };
    csv_reader.readAsText(this_file);
  }
  else if(this_file.name.indexOf('.txt') != -1) {
    console.log('txt reader used!');
    var txt_reader = new FileReader();
    txt_reader.onload = function(e) {
      var contents = e.target.result;
      trajectoryData = myMapController.processTxtData(contents);
      
      if(myMapController.trajectory_points == null) {
        myMapController.trajectory_points = trajectoryData;
      } else {
        myMapController.trajectory_points.push.apply(myMapController.trajectory_points, trajectoryData);
      }

      myMapController.trajectory_points.sort(function (a, b) {
        var diff;
        if(a.time == b.time){
          diff = (a.vessel!="own");
        } else {
          diff = a.time - b.time;
        }
         //alert(diff);
         return diff;
      });
      console.log("self.trajectory_points:", myMapController.trajectory_points);
      console.log("finish loading");
      alert("loading finished");
      myMapController.markers = []; // PURPOSE FOR DEBUGGING PURPOSE
      myMapController.cleanPreviousData(ask_confirmation);
      myMapController.setIsABMDrawing(true);
    };
    txt_reader.readAsText(this_file);
  }  
}

    
// function markdata(urlList){
//     alert(urlList.length);
//     //alert(markers.length);
//     //alert(current_window.length);
    
//     $.each(urlList, function() {
      
//       var data= this.split("\t\t\t");
//       var url=data[0];
//       var time=data[1];
//       var lat=data[2].substring(0,data[2].indexOf(","));
//       var lon=data[2].substring(data[2].indexOf(",")+1);
//       var header=data[3];
//       var city=header.substring(header.indexOf("</p><p><b>City: </b>")+"</p><p><b>City: </b>".length);
//       city=city.substring(0,city.indexOf("</p>"));
      
//       //alert(url+"|"+time+"|"+lat+" "+lon+"|"+city+"\n"+header);
      
//       var myLatlng = new google.maps.LatLng(lat,lon); 1.20075
            
//       var color= color_array[Math.floor(Number(time)/5000*(color_array.length-1))];
//        var image={
//             path: google.maps.SymbolPath.CIRCLE,
//             fillColor:color,
//             fillOpacity: .6,
//             scale: 10,
//             strokeColor: 'white',
//             strokeWeight: 1 
//          };
//             var index=myLatlng.toUrlValue().substring(0,myLatlng.toUrlValue().indexOf(","))+myLatlng.toUrlValue().substring(myLatlng.toUrlValue().indexOf(",")+1);
         
//          //alert("Index is : "+index);
//             if(list[index]==null) list[index]='<a href="http://'+url.toString()+'" target="_blank">'+
//                 url.toString()+'</a> '+' <label style="font-weight:normal;">'+time+'ms</label><br>';
//             else if(list[index].indexOf(url.toString())==-1)
//               list[index]=list[index] + '<a href="http://'+url.toString()+'" target="_blank">'+
//                 url.toString()+'</a> '+' <label style="font-weight:normal;">'+time+'ms</label><br>';
                
//             var content =header.substring(header.indexOf("<div style=\"width: 250px;height:200px;\">")+"<div style=\"width: 250px;height:200px;\">".length);
//             c_list[index]=content;

//            var infoW = new google.maps.InfoWindow({
//                 content: header+list[index]+"</div>",
//             });
          
          
//            current_window.push(infoW);
          
//             var marker = new google.maps.Marker({
//                 position: myLatlng,
//                 map: map,
//                 title: city,
//                 icon:image,
//             });
        
            
//             markers.push(marker);
//             m_url.push(url);
//             m_time.push(time);
//           //alert("Maker "+m_url.pop()+" is at "+ markers.pop().getPosition().toUrlValue());
//             //markers.push(marker);
//             //m_url.push(url);
//             google.maps.event.addListener(marker, 'click', function() {
//                     infoW.open(map,marker);
                 
//         });
//             //alert(infoW.getContent()+"\n");
      
//       });
    
//     //alert(markers.length);
//     //alert(current_window.length);
// }

