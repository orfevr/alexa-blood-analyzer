'use strict';
const Alexa = require('alexa-sdk');
const APP_ID = '';

const languageStrings = {
    'en-US': {
        'translation': {
            'SKILL_NAME': 'Blood Analyzer',
            LAUNCH_MESSAGE: 'Welcome to Blood Analyzer. I know what all this metrics mean. Ask me something.',
            'HELP_MESSAGE': 'Help message is not defined yet.',
            'STOP_MESSAGE': 'Would you like to stop?',
            'CANCEL_MESSAGE': 'Ok, let\'s play again soon.',
            'HELP_UNHANDLED': 'Say yes to continue, or no to end.'
        }
    }
};

function getPatientAgeSlotValue(intent) {
    return (intent && intent.slots && intent.slots.PatientAge && intent.slots.PatientAge.value && !isNaN(parseInt(intent.slots.PatientAge.value, 10))) ?
        parseInt(intent.slots.PatientAge.value, 10) : 0;
}

function getHemoglobinLevelSlotValue(intent) {
    return (intent && intent.slots && intent.slots.Level && intent.slots.Level.value && !isNaN(parseInt(intent.slots.Level.value, 10))) ?
        parseInt(intent.slots.Level.value, 10) : 0;
}

function getPatientTypeSlotValue(intent) {
    return (intent && intent.slots && intent.slots.PatientType && intent.slots.PatientType.value) ?
        intent.slots.PatientType.value : '';
}

function getPatientSubTypeSlotValue(intent) {
    return (intent && intent.slots && intent.slots.PatientSubType && intent.slots.PatientSubType.value) ?
        intent.slots.PatientSubType.value : '';
}

function getResponseValueTypeSlotValue(intent) {
    return (intent && intent.slots && intent.slots.ResponseValueType && intent.slots.ResponseValueType.value) ?
        intent.slots.ResponseValueType.value : '';
}

function removeSSML(s) {
    return s.replace(/<\/?[^>]+(>|$)/g, "");
};

const bloodAnalyzerHandlers = {
    'CheckHemogloginIntent': function () {

        const patientAge = getPatientAgeSlotValue(this.event.request.intent);
        const hemoglobinLevel = getHemoglobinLevelSlotValue(this.event.request.intent);
        const patientType = getPatientTypeSlotValue(this.event.request.intent);
        const patientSubType = getPatientSubTypeSlotValue(this.event.request.intent);
        const responseValueType = getResponseValueTypeSlotValue(this.event.request.intent);

        let speechOutput = '';
        if (patientType) {
            speechOutput += 'The ' + responseValueType + ' is 130 for ' + patientType;
        }
        else {
            speechOutput += 'The normal level is between 120 and 150 for average person';
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