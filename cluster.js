
class Bicluster {
    constructor(vec, left=null, right=null, distance=0.0, id=null) {
      this.left = left;
      this.right = right;
      this.vec = vec;
      this.id = id;
      this.distance = distance;
    }
  }

module.exports.Bicluster = Bicluster; 