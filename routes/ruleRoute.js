const router = require('express').Router();
const {
    getRules,
    getRule,
    getRuleTags,
    getRulesMeta,
    postRule,
    postRulesBulk,
    putRule,
    removeRule,
} = require('../controllers/Rule');
const ruleValidation = require('../validations/rule.validation');

router.get('/meta', getRulesMeta);
router.get('/tags', ruleValidation.listTags, getRuleTags);
router.get('/', ruleValidation.listRules, getRules);
router.get('/:id', ruleValidation.getRule, getRule);
router.post('/bulk', ruleValidation.bulkCreateRules, postRulesBulk);
router.post('/', ruleValidation.createRule, postRule);
router.put('/:id', ruleValidation.updateRule, putRule);
router.delete('/:id', ruleValidation.deleteRule, removeRule);

module.exports = router;
