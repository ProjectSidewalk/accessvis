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
result = [json.dumps(record) for record in data]
with open('nd-RawData.ndjson', 'w') as obj:
    for i in result:
        obj.write(i+'\n')