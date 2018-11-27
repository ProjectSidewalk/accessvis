# AccessVisDC: Interactive Visual Exploration of Physical Accessibility

## Abstract
For people with mobility impairments, street infrastructure such as sidewalks play a crucial role in navigating within cities. However, there is a severe lack of readily available tools for querying accessibility information. In this project, we will work on building a tool that will visualize _physical accessibility_ of Washington DC. The interactive prototype, _AccessVisDC_, will highlight (in)accessible areas of DC via creative use of geo-visualization techniques such as heat maps, street-level visualization and others, for a dataset of geo-tagged accessibility labels. This dataset is from [Project Sidewalk](http://projectsidewalk.io), an online tool that crowdsources labels for accessibility features and problems within Google Street View (GSV). This dataset has >250,000 labels on accessibility of sidewalks in Washington DC. Each label denotes a specific accessibility attribute in the physical world such as _Curb Ramp_, _Surface Problem_, _Obstacle in Path_, _Missing Curb Ramp_, its lat/lng position and associated metadata (severity rating, text description, and underlying GSV image). The data (label types with their positions) is available via [Project Sidewalk's GeoJSON API](http://projectsidewalk.io/api). The stakeholders of such a tool would be city residents (_esp._ people with mobility impairments), city governments, and researchers & data enthusiasts. Each stakeholder has their own requirements from such an interface. We start with the focus on one task that answers the question: "_What is the accessibility of a specific region and what are the factors influencing the accessibility of this region?_"

## Usage

1. Bootstrap the DB
```bash
$ docker-compose up -d db
$ docker-compose run --rm flaskapp /bin/bash -c "cd /opt/services/flaskapp/src && python -c  'import database; database.init_db()'"
```

2. Bring up the cluster
```bash
$ docker-compose up -d
```

3. Browse to localhost:8579 to see the app in action.
