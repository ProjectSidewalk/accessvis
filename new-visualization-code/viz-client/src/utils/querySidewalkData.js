export default async(curbSeverity = 1, lat1=38.794, lng1=-77.14, lat2=38.997, lng2=-76.891, excludecurbs = true) => {    
    /*sample url: https://sidewalk-sea.cs.washington.edu/v2/access/attributes?
                                    lat1=38.909&lng1=-76.989&lat2=38.912&lng2=-76.982&severity=3*/
    const url = 
        "https://sidewalk-dc.cs.washington.edu/v2/access/attributes?lat1=" + lat1 + 
                                                                   "&lng1=" + lng1 + 
                                                                   "&lat2=" + lat2 + 
                                                                   "&lng2=" + lng2 +
                                                                   "&severity=" + curbSeverity;
    fetch(url)
        .then(response => {
            return response.json();
        })
        .then(data => {
            if(excludecurbs) {
                data.features.filter(feature => feature.properties["Label Type"] !== "CurbRamp");
            }            
            return data;
        })
    
}