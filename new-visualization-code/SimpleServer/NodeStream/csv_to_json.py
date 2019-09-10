import pandas
import json

'''
df = pandas.read_csv('./RawData.csv', names=("Audit Task Id","Label Id","Label Type","Lat","Lng","Gsv Panorama Id","Severity","Canvas X","Canvas Y","Deleted","Description","Geom","Heading","Label Point Id","Panorama Lat","Panorama Lng","Photographer Heading","Photographer Pitch","Pitch","Problem Description Id","Sv Image X","Sv Image Y"))
df.to_json('RawData.json', orient='records')

with open('RawData2.json', 'w') as f:
    json.dump({'Features': df.to_dict(orient='records')}, f, indent=4)
'''

with open("RawData.json", "r") as read_file:
    data = json.load(read_file)
features = [record for record in data]
with open('nd-RawData.ndjson', 'w') as obj:
    #aggregate objects
    count = 0
    totalIndex = 0
    featureCollection = {"type": "FeatureCollection", "features": []}
    for result in features:
        print("processing feature ", count+1, "/1000")
        if count == 1000 or totalIndex == (len(features) - 1):
            print("writing to file")
            dump = json.dumps(featureCollection)
            obj.write(dump + '\n')
            count = 0
            featureCollection = {"type": "FeatureCollection", "features": []}        
            print("write complete", count, featureCollection)
        featureCollection["features"].append(
            {"type": "Feature", "properties": {
                "Audit Task Id": result["Audit Task Id"],
                "Label Id": result["Label Id"],
                "Labey Type": result["Label Type"],
                "Lat": result["Lat"],
                "Lng": result["Lng"],
                "Gsv Panorama Id": result["Gsv Panorama Id"],
                "Severity": result["Severity"],                
            }, "geometry": {
                    "type": "Point",
                    "coordinates": [result["Lng"], result["Lat"]]
                }}
        )
        count+=1
        totalIndex +=1
print("processing complete ...")        