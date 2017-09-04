// user upload - slingshot
Slingshot.fileRestrictions( "uploadToAmazonS3", {
  allowedFileTypes: [ "image/png", "image/jpeg", "image/gif" ],
  maxSize: 3 * 1024 * 1024 // 3 MB
});

Slingshot.createDirective( "uploadToAmazonS3", Slingshot.S3Storage, {
  bucket: "virtual-race-submissions",
  acl: "public-read",
  region: 'ap-southeast-1',
  AWSAccessKeyId: "AKIAIJC5UMTI5F4TRYTQ",
  AWSSecretAccessKey: "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",
  authorize: function ( file, category ) {    
    if (!this.userId) {
      var message = "Please login before posting files";
      throw new Meteor.Error("Login Required", message);
    }

    return true;
  },
  key: function ( file, category ) {
    var fileName = file.name;
    var user = Meteor.users.findOne( this.userId );
    var newFileName = category.name + '-' + Math.random().toString(36).substr(2, 5);
    
    if (fileName) {
      newFileName = fileName.replace(/[^A-Z0-9]+/ig, "-");    
    }    
    var name = user.profile.name.replace(/[^A-Z0-9]+/ig, "-").toLowerCase();     
    return name + "/" + newFileName + moment(new Date()).format('DD-MMM-YYYY-hmmss');
  }
});
