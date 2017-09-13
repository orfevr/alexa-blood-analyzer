'use strict';

const Alexa = require('alexa-sdk');
const Hemoglobin = require('./hemoglobin');
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
        const userInput = {
            patientAge: getPatientAgeSlotValue(this.event.request.intent),
            hemoglobinLevel: getHemoglobinLevelSlotValue(this.event.request.intent),
            patientType: getPatientTypeSlotValue(this.event.request.intent, 'adult'),
            patientSubType: getPatientSubTypeSlotValue(this.event.request.intent),
            responseValueType: getResponseValueTypeSlotValue(this.event.request.intent)
        };

        const response = Hemoglobin.getCheckHemogloginIntentResponse(userInput);
        const speechOutput = this.t.apply(this, [ response.messageResourceKey, ...response.messageParams ]);

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