
var TRIPLE_GAME = TRIPLE_GAME || ( function () {

    var _board = [];
    var  board_size = 5;
    var _next_figure = 1;
    var _total_score = 0;
    var _reserve = 0;
        
    return {

        // start new game
        new_game: function() { _new_game(); }, 
        
        // user action move next_figure to (x y)
        user_move: function(x, y) { return _user_move(x,y); },
        
        // check if next_figure can placed on (x y)
        is_legal_move: function(x, y) { return _board[y][x] === 0; },

        // get figure at (x y)
        get_figure: function(x, y) { return _board[y][x]; },
        
        next_figure: function() { return _next_figure; },
        
        total_score: function() { return _total_score; },

        // get or set reserve
        reserve: function(swap) { return swap_reserve(swap); },
        
        game_over: function() { return _game_over(); }
        
    };
    

    function new_board() {
        var result = new Array();
        for (var y = 0; y < board_size; ++y) {
            var r = new Array();
            result.push(r);
            for (var x = 0; x < board_size; ++x) r.push(0);
        }
        return result;
    };

      function valid_pos( x, y ) {
        return (x >= 0) && (x < board_size) && (y >= 0) && (y < board_size);
      }

      function indexOf_pos( a, pos ) {
        if((!a) || (a.length === 0)) return -1;
        for(var i = 0; i < a.length; ++i) {
          if( (a[i][0] === pos[0]) && (a[i][1] === pos[1]) )
            return i;
        }
        return -1;	
      }

      function copy_board() {
        var result = new Array();
        for (var y = 0; y < board_size; ++y) {
         var r = new Array();
         result.push(r);
         for (var x = 0; x < board_size; ++x) {
           r.push(_board[y][x]);
         }
        }
        return result;
      }


      function neighbours( x, y ) {
        var a = new Array();
            if(valid_pos(x+1,y)) a.push([x+1,y]);
            if(valid_pos(x-1,y)) a.push([x-1,y]);
            if(valid_pos(x,y+1)) a.push([x,y+1]);
            if(valid_pos(x,y-1)) a.push([x,y-1]);
            return a;
      }


      function partners( x, y, f, b ) {
        var n = neighbours(x, y);
        var r = new Array();
        var bo = b ? b : copy_board();
        var fig = f ? f : bo[y][x];
        n.forEach(function (v) { if(fig === bo[v[1]][v[0]]) r.push(v); });
        bo[y][x] = -fig;
        r.forEach(function (v) {
          var n = partners(v[0], v[1], fig, bo);
          n.forEach(function (v) {
            if( indexOf_pos(r, v) === -1 ) r.push(v);
          });
        });
        return r;
      }

     function new_figure() {
      f = 1;
      var r = Math.random();
      if(r > 0.85) f = 2;
      if(r > 0.95) f = 3;
      if(r > 0.99) f = 4;
      if(Math.random() > 0.8) f += 100;
      return f;
    };


    function set_figure(x,y,f) {
      _board[y][x] = f;
    }
    
    
    function set_sample_board() {
          set_figure(1,1,1);
          set_figure(1,1,1);
          set_figure(2,2,1);
          set_figure(4,3,1);
          set_figure(4,4,2);
          set_figure(4,5,1);
          set_figure(5,5,3);
    }
    
    function set_random_board() {
      for(var i=0; i < board_size; ++i) {
          var x = Math.floor(Math.random() * 5);
          var y = Math.floor(Math.random() * 5);
          var f = new_figure();
            set_figure(x,y,f);
      }  
    }
    
    function _new_game() {
        _board = new_board();
        _total_score = 0;
        _reserve = 0;
        _next_figure = new_figure();
        set_random_board();
//        set_sample_board();
    }

    function swap_reserve(swap) {
        swap = swap ? swap : false;
        if(! swap) return _reserve;
        swap = _reserve;
        _reserve = _next_figure;
        _next_figure = swap;
        if(_next_figure === 0)
          _next_figure = new_figure();
        return _reserve;
    }

    function _user_move( x, y ) {

        if(_board[y][x] !== 0) return 0;

        var fig = _next_figure;
        var score = 0;
        _next_figure = new_figure();

        var l = partners( x, y, fig );
        if(l.length < 2) {
          _board[y][x] = fig;
          score = fig;
          _total_score += score;
          return score;
        }

        while( l.length > 1 ) {
          fig += 1; 
          score += fig * l.length;
          l.forEach(function (v, i, a) { _board[v[1]][v[0]] = 0; });
          l = partners( x, y, fig );
        };
        _board[y][x] = fig;
        _total_score += score;
        return score;
    };

    function _game_over() {
        for (var y = 0; y < board_size; ++y) 
          for (var x = 0; x < board_size; ++x) 
            if(_board[y][x] === 0)
                return false;
        return true;
    }

    
});        

