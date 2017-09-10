'use strict';
const Alexa = require('alexa-sdk');
const APP_ID = '';

const languageStrings = {
    'en-US': {
        'translation': {
            'SKILL_NAME': 'Blood Analyzer',
            'LAUNCH_MESSAGE': 'Welcome to Blood Analyzer. I know what all this metrics mean. Ask me something.',
            'HELP_MESSAGE': 'For example, ask What is the lower limit of hemoglobin for adult',
            'STOP_MESSAGE': 'Would you like to stop?',
            'CANCEL_MESSAGE': 'Ok, let\'s interact again soon.',
            'HELP_UNHANDLED': 'For example, ask What is the lower limit of hemoglobin for adult',
            'HEMOGLOBIN_LIMIT_MESSAGE': 'The %s is %s gram per litre for %s of this age.',
            'HEMOGLOBIN_RANGE_MESSAGE': 'The normal level is between %s and %s gram per litre for %s of this age.',
            'HEMOGLOBIN_ERROR_MESSAGE': 'Please refine your question. '
        }
    }
};

const bloodAnalyzerHandlers = {
    'CheckHemogloginIntent': function () {

        const patientAge = getPatientAgeSlotValue(this.event.request.intent);
        const hemoglobinLevel = getHemoglobinLevelSlotValue(this.event.request.intent);
        const patientType = getPatientTypeSlotValue(this.event.request.intent, 'adult');
        const patientSubType = getPatientSubTypeSlotValue(this.event.request.intent);
        const responseValueType = getResponseValueTypeSlotValue(this.event.request.intent);

        const sex = getPatientSex(patientType, patientSubType);
        const ageByPatientType = tryGetAgeByPatientType(patientType);
        const res = getHemoglobinRange((patientAge > 0) ? patientAge : ageByPatientType, sex);

        let speechOutput;
        if (!res.error) {
            let rangeForOutput;
            if (res.length > 1) {
                //both male and female returned - no sex provided/determined.
                rangeForOutput = {
                    minValue: res[0].minValue < res[1].minValue ? res[0].minValue : res[1].minValue,
                    maxValue: res[0].maxValue > res[1].maxValue ? res[0].maxValue : res[1].maxValue
                }
            }
            else {
                rangeForOutput = res[0];
            }
            speechOutput = getResponseMessageForRange.call(this, responseValueType, rangeForOutput, patientType);
        }
        else {
            speechOutput = this.t('HEMOGLOBIN_ERROR_MESSAGE');
        }

        this.response.cardRenderer(this.t('SKILL_NAME', removeSSML(speechOutput)));
        this.response.speak(speechOutput);
        this.emit(':responseReady');
    }
};

const amazonStateHandlers = {
    'AMAZON.HelpIntent': function () {
        const newGame = !(this.attributes['speechOutput'] && this.attributes['repromptText']);
        this.emitWithState('helpTheUser', newGame);
    },
    'AMAZON.StopIntent': function () {
        const speechOutput = this.t('STOP_MESSAGE');
        this.response.speak(speechOutput).listen(speechOutput);
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak(this.t('CANCEL_MESSAGE'));
        this.emit(':responseReady');
    },
    'Unhandled': function () {
        const speechOutput = this.t('HELP_UNHANDLED');
        this.response.speak(speechOutput).listen(speechOutput);
        this.emit(':responseReady');
    }
};


exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.resources = languageStrings;
    alexa.registerHandlers(bloodAnalyzerHandlers, amazonStateHandlers);
    alexa.execute();
};

function removeSSML(s) {
    return s.replace(/<\/?[^>]+(>|$)/g, "");
};

function getResponseMessageForRange(responseValueType, range, patientType) {

    switch (responseValueType) {
        case 'upper limit':
            return this.t('HEMOGLOBIN_LIMIT_MESSAGE', 'upper limit', range.maxValue.toString(), patientType);
        case 'lower limit':
        case 'limit':
            return this.t('HEMOGLOBIN_LIMIT_MESSAGE', 'lower limit', range.minValue.toString(), patientType);
        default:
            return this.t('HEMOGLOBIN_RANGE_MESSAGE', range.minValue.toString(), range.maxValue.toString(), patientType);
    }
}

function getPatientAgeSlotValue(intent) {
    return (intent && intent.slots && intent.slots.PatientAge && intent.slots.PatientAge.value && !isNaN(parseInt(intent.slots.PatientAge.value, 10))) ?
        parseInt(intent.slots.PatientAge.value, 10) : 0;
}

function getHemoglobinLevelSlotValue(intent) {
    return (intent && intent.slots && intent.slots.Level && intent.slots.Level.value && !isNaN(parseInt(intent.slots.Level.value, 10))) ?
        parseInt(intent.slots.Level.value, 10) : 0;
}

function getPatientTypeSlotValue(intent, defaultValue = '') {
    return (intent && intent.slots && intent.slots.PatientType && intent.slots.PatientType.value) ?
        intent.slots.PatientType.value : defaultValue;
}

function getPatientSubTypeSlotValue(intent) {
    return (intent && intent.slots && intent.slots.PatientSubType && intent.slots.PatientSubType.value) ?
        intent.slots.PatientSubType.value : '';
}

function getResponseValueTypeSlotValue(intent) {
    return (intent && intent.slots && intent.slots.ResponseValueType && intent.slots.ResponseValueType.value) ?
        intent.slots.ResponseValueType.value : 'range';
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

function getHemoglobinRange(age, sex) {

    const db = [
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

    let rangesForAge = db.find((range) => {
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