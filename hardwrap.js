function hardWrap(str, len)
{
  // split str into 'lines'
  var lines = str.split(/\n/);
  lines = lines.map(function(line) {
    var out = ''; 
    var curline = ''; 
    words = line.split(/ +/);
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (curline.length + 1 + w.length > len) {
        out += curline + '\n';
        curline = w;
      } else {
        curline += (curline ? ' ' : '') + w;
      }   
    }   
    if (curline)
      out += curline;
    return out;
  }); 
  return lines.join('\n');
}

module.exports = {
  hardWrap: hardWrap
};
