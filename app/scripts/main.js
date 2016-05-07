'use strict';
/*global $ $:true*/
/*eslint no-undef: "error"*/
$(function(){
  var zobis = {};
  var zidans = [];
  var move = $('#move').get(0).getContext('2d');

  var id2key = function(x, y){
    return x + '-' + y;
  };
  ////////////////////////////////////////////////////////////////////
  // 子弹
  class Zidan {
    constructor(pos, speed, row){
      this.row = row;
      this.pos = pos;
      this.speed = speed;
    }

    drawSelf(){
      var ctx = move;
      ctx.save();
      ctx.translate(this.pos.x, this.pos.y );
      ctx.fillStyle = '#498727';
      ctx.fillRect(0, 0, 10, 10);
      ctx.restore();
    }

    isHitZobi(){
      var min = Infinity;
      var zobi;
      $.each(zobis[ this.row ], function(_, v){
        if( min > v.pos.x ){
          min = v.pos.x;
          zobi = v;
        }
      });
      if ( this.pos.x > min ){
        zobi.life -= 2;
        if( zobi.life === 0 ){
          zobis[ this.row ] = $.grep(zobis[ this.row ], function(v){
            return v !== zobi;
          });
          if( zobis[this.row].length === 0 ){
            delete zobis[this.row];
            $.each( g.findPlant( this.row ), function(_, v){
              v.stopShoot();
            });
          }
        }
        return true;
      }else{
        return false;
      }
    }
  }
  ////////////////////////////////////////////////////////////////////
  //  植物
  function Plant(type, spec, pos){
    // 植物类型
    this.type = type;
    // 每隔多少秒射击
    this.spec = spec;
    //植物位置
    this.pos = pos;
    this.isShoot = false;
    this.timerId = null;
  }
  Plant.prototype.startShoot = function () {
    if( this.isShoot ){
      return;
    }
    this.isShoot = true;
    var self = this;
    this.timerId = setInterval(function(){
      var pos = {x: self.pos.x * 80 + 30, y: self.pos.y * 80 + 30};
      var zidan = new Zidan(pos, 1, self.pos.y);
      zidan.drawSelf();
      zidans.push(zidan);
    }, this.spec);
  };
  Plant.prototype.stopShoot = function () {
    this.isShoot = false;
    clearInterval(this.timerId);
  };
  ////////////////////////////////////////////////////////////////////
  //  僵尸
  function Z( pos, speed, life ) {
    this.pos = pos;
    this.speed = speed;
    this.life = life;
  }
  Z.prototype.drawSelf = function () {
    var ctx = move;
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.fillStyle = '#c85d18';
    ctx.fillRect(0, 0, 80, 80);
    ctx.restore();
  };
  setInterval(function(){
    var row = Math.floor( Math.random() * 5 );
    var num = Math.floor( Math.random() * 2 + 1 );
    if( !zobis[row] ){
      zobis[row] = [];
    }
    for( var i = 0; i < num; i++){
      zobis[row].push( new Z( {x: 720, y: row * 80}, Math.random() + 0.1, 10));
    }
  }, 3000);



  ///////////////////////////////////////////////////////////////////
  // 地板
  function Ground(){
    this.ctx = $('#ground').get(0).getContext('2d');
    this.plants = {};
    //这个按行存放植物
    this.rowPlants = {};
    this.drawGround();
  }
  Ground.prototype.findPlant = function (row) {
    return this.rowPlants[row] || [];
  };
  Ground.prototype.drawGround = function () {
    for (var i = 0; i < 8; i++) {
      for(var j = 0; j < 5; j++){
        this.draw(i, j, 'block');
      }
    }
  };
  Ground.prototype.draw = function (x, y, type) {
    var ctx = this.ctx;
    ctx.save();
    ctx.translate(x * 80, y * 80);
    if( type === 'plants' ){
      ctx.fillStyle = '#1aa64a';
      ctx.fillRect(0, 0, 80, 80);
    }else if(type === 'block' ){
      ctx.strokeStyle = '#9cbaa1';
      ctx.strokeRect(0, 0, 80, 80);
    }
    ctx.restore();
  };

  var g = new Ground();

  $('#position').on('click', function (e) {
    var x = Math.floor( e.offsetX / 80 );
    var y = Math.floor( e.offsetY / 80 );
    var posKey = id2key(x, y);
    if( g.plants[ posKey ] === undefined ){
      g.plants[ posKey ] = true;

      g.draw(x, y, 'plants');

      var plant = new Plant('plants', 1000, {x: x, y: y});

      if( g.rowPlants[ y ] === undefined){
        g.rowPlants[ y ] = [];
      }
      g.rowPlants[ y ].push(plant);

    }
  });

  //////////////////////////////////////////////////////////////////

  // 动画函数 管理子弹和僵尸 以及他们的碰撞

  var render = function () {
    var ctx = move;
    ctx.clearRect(0, 0, 800, 400);
    // 画运动中的僵尸  同时找到与僵尸同行的植物 让他们开始射击
    if( !$.isEmptyObject(zobis) ){

      var plants = [];
      $.each(zobis, function(k, v){
        $.each(v, function(_, zobi){
          zobi.pos.x -= zobi.speed;
          zobi.drawSelf();
        });
        $.merge(plants, g.findPlant( k ) );
      });
      $.each(plants, function(_, v){
        if( v.isshoot === true ){
          return;
        }else{
          v.startShoot();
        }
      });
    }
    // 画运动中的子弹
    if( zidans.length ){
      var reminderzidan = [];
      $.each(zidans, function(_, v){
        v.pos.x += v.speed;
        v.drawSelf();
        if( !v.isHitZobi() && v.pos.x < 720 ){
          reminderzidan.push(v);
        }
      });
      zidans = reminderzidan;
    }
  };
  setInterval(render, 13);
});
