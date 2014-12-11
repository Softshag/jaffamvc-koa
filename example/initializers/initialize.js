

module.exports = function (done) {
  console.log(this)
  setTimeout(function () {
    done()
  }, 300);
}
