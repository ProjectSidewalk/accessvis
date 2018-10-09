function getColor(d) {
    console.log(d + "\n");
    return d > 0.75 ? '#4dac26' :
        d > 0.5 ? '#b8e186' :
        d > 0.25 ? '#f1b6da' :
        '#d01c8b';
}

function labelingColorMapping(category) {
    var colors = {
        Walk: {
            id: 'Walk',
            fillStyle: 'rgba(0, 0, 0, 1)',
            strokeStyle: '#ffffff'
        },
        CurbRamp: {
            id: 'CurbRamp',
            fillStyle: 'rgba(0, 222, 38, 1)', // 'rgba(0, 244, 38, 1)'
            strokeStyle: '#ffffff'
        },
        NoCurbRamp: {
            id: 'NoCurbRamp',
            fillStyle: 'rgba(233, 39, 113, 1)', // 'rgba(255, 39, 113, 1)'
            strokeStyle: '#ffffff'
        },
        Obstacle: {
            id: 'Obstacle',
            fillStyle: 'rgba(0, 161, 203, 1)',
            strokeStyle: '#ffffff'
        },
        Other: {
            id: 'Other',
            fillStyle: 'rgba(179, 179, 179, 1)', //'rgba(204, 204, 204, 1)'
            strokeStyle: '#0000ff'

        },
        Occlusion: {
            id: 'Occlusion',
            fillStyle: 'rgba(179, 179, 179, 1)',
            strokeStyle: '#009902'
        },
        NoSidewalk: {
            id: 'NoSidewalk',
            fillStyle: 'rgba(179, 179, 179, 1)',
            strokeStyle: '#ff0000'
        },
        SurfaceProblem: {
            id: 'SurfaceProblem',
            fillStyle: 'rgba(241, 141, 5, 1)',
            strokeStyle: '#ffffff'
        },
        Void: {
            id: 'Void',
            fillStyle: 'rgba(255, 255, 255, 1)',
            strokeStyle: '#ffffff'
        },
        Unclear: {
            id: 'Unclear',
            fillStyle: 'rgba(128, 128, 128, 0.5)',
            strokeStyle: '#ffffff'
        }
    };
    return category ? colors[category].fillStyle : colors;
}