var fs = require('fs');
/**
* Function that extracts top posts, non-top posts, and daily top posts as CSV and JSON
* @author   Christian
* @param    {String} file    CSV file containing post data
* @param    {Boolean} outputJson Determines whether or not to output JSON of each CSV
* @param    {Boolean} outputDetailed Determines whether or not to output detailed versions
* @return   Exports files into director "./output"
*/
const postsAnalyzer = (file, outputJson, outputDetailed) => {
    // Reading the file using default fs import
    csv = fs.readFileSync(file)
    // Convert the data to String and split it in an array - "\n" will separate by line.
    var array = csv.toString().split("\n");

    /**
    * Now that we have an array of each line we want to create each line's respective object.
    * Since commas may be found within the post's title, we can create substrings from the back to front 
    * after extracting the id for each object property by index of comma's found up until we only have the title left. 
    * We want to exclude the last 'row' because the line break will give us an empty value
    */
    const objectArray = array.slice(0,-1).map(string => {    
        let splitHolder = string.substring(string.indexOf(','));
        const id = string.substring(0,string.indexOf(','))
        
        const timestamp = string.substring(string.lastIndexOf(',') +1)
        splitHolder = splitHolder.substring(0,splitHolder.lastIndexOf(timestamp)-1)

        const comments = splitHolder.substring(splitHolder.lastIndexOf(',')+1)
        splitHolder = splitHolder.substring(0, splitHolder.lastIndexOf(comments)-1)
    
        const views = splitHolder.substring(splitHolder.lastIndexOf(',')+1)
        splitHolder = splitHolder.substring(0, splitHolder.lastIndexOf(views)-1)
    
        const likes = splitHolder.substring(splitHolder.lastIndexOf(',')+1)
        splitHolder = splitHolder.substring(0, splitHolder.lastIndexOf(likes)-1)
    
        const privacy = splitHolder.substring(splitHolder.lastIndexOf(',')+1)
        splitHolder = splitHolder.substring(0, splitHolder.lastIndexOf(privacy)-1)
    
        const title = splitHolder.substring(1)
    
        const object = {
            id,
            title,
            privacy,
            likes,
            views,
            comments,
            timestamp
        }
        return object;
    })

    /**
     * The array of objects is now filtered for the following rules:
     * The post must be public 
     * The post must have over 10 comments and over 9000 views
     * The post title must be under 40 characters
    */
    const detailedTopJSON = objectArray.filter((object,index) => {
        if(object.privacy === 'public' && object.comments > 10 && object.views > 9000 && object.title.length < 40){
            return true
        } if(index === 0){ return true} else { return false}
    })
        //We map the JSON array to extract each posts ID
        const topPostsIds = detailedTopJSON.map((object,index) => index !== 0 ? "\r\n".concat(object.id) : object.id);

        //We map the JSON array and extract each object's property and join them as a string for detailed CSV
        //Check if index is 0 so that an unnecessary line break is not added at top of CSV file
        const detailedTopCSV = detailedTopJSON.map((object,index) => {
            const string = index !== 0? "\r\n".concat(Object.keys(object).map(key => object[key]).join(",")) : Object.keys(object).map(key => object[key]).join(",");
            return string
        })

     /**
     * The array of objects is also filtered for posts that don't meet the criteria.
     * We derive 2 arrays as above - a detailed version and a version with only IDs
     */
    const otherPosts = objectArray.filter(object => {
      if(object.privacy === 'public' && object.comments > 10 && object.views > 9000 && object.title.length < 40){
          return false
      } else { return true}
      })
    const otherPostsDetailed = otherPosts.map((object,index) => {
      const string = index !== 0? "\r\n".concat(Object.keys(object).map(key => object[key]).join(",")) : Object.keys(object).map(key => object[key]).join(",");
      return string
    })
    const otherPostsIds = otherPosts.map((object,index) => index !== 0 ? "\r\n".concat(object.id) : object.id);

    /**
    * We want to extract the posts with highest likes on a per-day basis
    * We extract the year/month/date from each timestamp, sort, group as a Map, 
    * extract post with highest likes, then push that to a new array.
    */

    //Takes the array of "top" objects and appends a new "date" property
    const dateSorted = detailedTopJSON.map((object,index) => {
      if(index > 0){
      var dateObj = new Date(object.timestamp);
      var month = dateObj.getUTCMonth() + 1; //months from 1-12
      var day = dateObj.getUTCDate();
      var year = dateObj.getUTCFullYear();

      newdate = year + "/" + month + "/" + day;
      object.date = newdate;
    } else { object.date = "date"}
      return object
    }).sort((a,b) => new Date(a.timestamp)-new Date(b.timestamp))

    /**
     * Helper Function - groups an array by designated object key/property.
     *
     * @param {Array} list The array to group.
     * @param {Function} keyGetter Function with specified object and key/property to group by
     * @return {Map} a Map grouped by specified key/property.
     */
    function groupBy(list, keyGetter) {
      const map = new Map();
      list.forEach((item) => {
           const key = keyGetter(item);
           const collection = map.get(key);
           if (!collection) {
               map.set(key, [item]);
           } else {
               collection.push(item);
           }
      });
      return map;
  }

  //Declare an array to push daily high post items to
  let dailyHigh = [];

  //Groups the date-sorted array as a Map with specific days as the key
  const grouped = groupBy(dateSorted, object => object.date);
      //We iterate through the Map. Each iteration will isolate a specific date's posts
      grouped.forEach(object => {
        //Now that we specfici date's isolated as an array. We reduce that date's posts by likes
        //to extract the post with the highest value of likes.
        dailyHigh.push(object.reduce((prev,curr) => {
          return Number(prev.likes) > Number(curr.likes) ? prev : curr;
        }))
      })

  //We create the CSV-like array as above. 
  const detailedDailyHighCSV = dailyHigh.map((object,index) => {
    const string = index !== 0? "\r\n".concat(Object.keys(object).map(key => object[key]).join(",")) : Object.keys(object).map(key => object[key]).join(",");
    return string
  })

  //Export the actual CSV files into output directory
  if(!outputJson){
    fs.writeFileSync('./output/top_posts.csv', topPostsIds)
    fs.writeFileSync('./output/other_posts.csv', otherPostsIds)
    fs.writeFileSync('./output/daily_top_posts.csv', detailedDailyHighCSV)
      
    //BONUS - export the detailed versions of the posts
      if(outputDetailed){
        fs.writeFileSync('./output/top_posts_detailed.csv', detailedTopCSV)
        fs.writeFileSync('./output/other_posts_detailed.csv', otherPostsDetailed)
      }
  }

  //BONUS - option to export JSON or CSV versions of the files
  if(outputJson){
    // Generate the JSON output file.
    // We slice at the first index to avoid the headers row
    fs.writeFileSync('./output/json/top-posts-detailed.json', JSON.stringify(detailedTopJSON.slice(1)))
    fs.writeFileSync('./output/json/top-posts.json', JSON.stringify(detailedTopJSON.slice(1).map(post => {return {id: post.id}})))
    fs.writeFileSync('./output/json/other-posts.json', JSON.stringify(otherPosts.slice(1)))
    fs.writeFileSync('./output/json/other-post-detailed.json', JSON.stringify(otherPosts.slice(1).map(post => {return {id: post.id}})))
    fs.writeFileSync('./output/json/daily_top_posts_detailed.json', JSON.stringify(dailyHigh.slice(1)))
  }
}

module.exports = postsAnalyzer;