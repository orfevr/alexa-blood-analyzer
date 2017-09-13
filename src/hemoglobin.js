'use strict';

module.exports = {
    getCheckHemogloginIntentResponse: getCheckHemogloginIntentResponse
};

const defaultRanges = [
    {
        ageMin: 1,
        ageMax: 5,
        ranges: [
            {
                sex: ['all'],
                minValue: 100,
                maxValue: 140
            }
        ]
    },
    {
        ageMin: 5,
        ageMax: 10,
        ranges: [
            {
                sex: ['all'],
                minValue: 115,
                maxValue: 145
            }
        ]
    },
    {
        ageMin: 10,
        ageMax: 12,
        ranges: [
            {
                sex: ['all'],
                minValue: 120,
                maxValue: 150
            }
        ]
    },
    {
        ageMin: 12,
        ageMax: 15,
        ranges: [
            {
                sex: ['female'],
                minValue: 115,
                maxValue: 150
            },
            {
                sex: ['male'],
                minValue: 120,
                maxValue: 160
            }
        ]
    },
    {
        ageMin: 15,
        ageMax: 18,
        ranges: [
            {
                sex: ['female'],
                minValue: 117,
                maxValue: 153
            },
            {
                sex: ['male'],
                minValue: 117,
                maxValue: 166
            }
        ]

    },
    {
        ageMin: 18,
        ageMax: 45,
        ranges: [
            {
                sex: ['female'],
                minValue: 117,
                maxValue: 155
            },
            {
                sex: ['male'],
                minValue: 132,
                maxValue: 173
            }
        ]

    },
    {
        ageMin: 45,
        ageMax: 65,
        ranges: [
            {
                sex: ['female'],
                minValue: 117,
                maxValue: 160
            },
            {
                sex: ['male'],
                minValue: 131,
                maxValue: 172
            }
        ]

    },
    {
        ageMin: 65,
        ageMax: 150,
        ranges: [
            {
                sex: ['female'],
                minValue: 120,
                maxValue: 161
            },
            {
                sex: ['male'],
                minValue: 126,
                maxValue: 174
            }
        ]
    }
];

function getRangeDataFor(age, sex) {

    let rangesForAge = defaultRanges.find((range) => {
        return age >= range.ageMin && age < range.ageMax;
    });

    if (rangesForAge && rangesForAge.ranges) {
        return rangesForAge.ranges
            .filter((range) => {
                if (!sex || sex === 'all') {
                    return true;
                }
                else {
                    return range.sex && (range.sex.includes(sex) || range.sex.includes("all"));
                }
            });
    }
    else {
        return {
            error: true,
            message: 'Incorrect age'
        };
    }
}

function getCheckHemogloginIntentResponse(userInput) {

    const sex = getPatientSex(userInput.patientType, userInput.patientSubType);
    const ageByPatientType = tryGetAgeByPatientType(userInput.patientType);
    const res = getRangeDataFor((userInput.patientAge > 0) ? userInput.patientAge : ageByPatientType, sex);

    if (!res.error) {
        let rangeForOutput = (res.length > 1) ? getAbsoluteRange() : res[0];
        return getResponseMessageForRange(userInput.responseValueType, rangeForOutput, userInput.patientType);
    }
    else {
        return {messageResourceKey: 'HEMOGLOBIN.HEMOGLOBIN_ERROR_MESSAGE'};
    }
}

function getAbsoluteRange(ranges) {
    return {
        minValue: ranges[0].minValue < ranges[1].minValue ? ranges[0].minValue : ranges[1].minValue,
        maxValue: ranges[0].maxValue > ranges[1].maxValue ? ranges[0].maxValue : ranges[1].maxValue
    }
}

function getPatientSex(patientType, patientSubType) {
    if (patientSubType.toLowerCase() === 'pregnant') {
        return 'female';
    }
    return patientType.toLowerCase() === 'men' ? 'male' : patientType.toLowerCase() === 'women' ? 'female' : 'all';
}

function tryGetAgeByPatientType(patientType) {
    if (!patientType) {
        return 0;
    }

    var ages = [
        {
            patientType: 'newborn',
            ageExample: 0.1
        },
        {
            patientType: 'infant',
            ageExample: 1
        },
        {
            patientType: 'child',
            ageExample: 3
        },
        {
            patientType: 'teenager',
            ageExample: 14
        },
        {
            patientType: 'adult',
            ageExample: 35
        },
        {
            patientType: 'men',
            ageExample: 35
        },
        {
            patientType: 'women',
            ageExample: 35
        }
    ];

    var patientTypeMatch = ages.find((age) => {
        return age.patientType === patientType;
    });

    return patientTypeMatch ? patientTypeMatch.ageExample : 0;
}

function getResponseMessageForRange(responseValueType, range, patientType) {

    let alexaResponseMessage = {
        messageResourceKey: '',
        messageParams:[]
    };

    switch (responseValueType) {
        case 'upper limit':
            alexaResponseMessage.messageResourceKey = 'HEMOGLOBIN_LIMIT_MESSAGE';
            alexaResponseMessage.messageParams = ['upper limit', range.maxValue.toString(), patientType];
            break;
        case 'lower limit':
        case 'limit':
            alexaResponseMessage.messageResourceKey = 'HEMOGLOBIN_LIMIT_MESSAGE';
            alexaResponseMessage.messageParams = ['lower limit', range.minValue.toString(), patientType];
            break;
        default:
            alexaResponseMessage.messageResourceKey = 'HEMOGLOBIN_RANGE_MESSAGE';
            alexaResponseMessage.messageParams = [range.minValue.toString(), range.maxValue.toString(), patientType];
            //return this.t('HEMOGLOBIN_RANGE_MESSAGE', range.minValue.toString(), range.maxValue.toString(), patientType);
            break;
    }

    return alexaResponseMessage;
}