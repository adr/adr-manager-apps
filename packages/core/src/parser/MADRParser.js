// Generated from MADR.g4 by ANTLR 4.13.2
// jshint ignore: start
import antlr4 from 'antlr4';
import MADRListener from './MADRListener.js';
const serializedATN = [4,1,25,309,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,
4,2,5,7,5,2,6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,
2,13,7,13,2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,19,2,
20,7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,26,7,26,2,27,
7,27,1,0,1,0,1,0,3,0,60,8,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,3,0,70,8,0,1,
0,1,0,3,0,74,8,0,1,0,1,0,1,0,1,0,3,0,80,8,0,1,0,1,0,3,0,84,8,0,1,0,1,0,1,
0,1,0,3,0,90,8,0,1,0,1,0,1,0,3,0,95,8,0,1,0,1,0,1,0,1,0,3,0,101,8,0,1,0,
1,0,3,0,105,8,0,1,0,1,0,3,0,109,8,0,1,0,1,0,1,0,1,0,3,0,115,8,0,1,0,1,0,
1,0,3,0,120,8,0,1,0,1,0,1,0,1,0,3,0,126,8,0,1,0,1,0,1,0,1,0,1,0,3,0,133,
8,0,1,0,1,0,1,0,1,0,1,0,3,0,140,8,0,1,0,1,0,1,0,3,0,145,8,0,1,0,1,0,1,0,
1,0,3,0,151,8,0,1,0,1,0,1,0,3,0,156,8,0,1,0,1,0,1,0,1,0,3,0,162,8,0,1,0,
1,0,1,0,3,0,167,8,0,1,0,1,0,1,0,1,0,3,0,173,8,0,1,0,1,0,1,1,1,1,1,1,1,1,
1,2,1,2,1,3,1,3,1,4,1,4,1,5,1,5,1,6,1,6,1,7,1,7,1,8,1,8,1,9,1,9,1,10,1,10,
1,10,1,10,1,10,1,10,3,10,203,8,10,1,10,1,10,3,10,207,8,10,1,10,1,10,1,10,
1,10,3,10,213,8,10,1,10,1,10,3,10,217,8,10,1,11,1,11,1,11,4,11,222,8,11,
11,11,12,11,223,1,12,1,12,1,12,1,12,1,12,1,12,3,12,232,8,12,1,12,1,12,1,
12,3,12,237,8,12,1,12,1,12,1,12,3,12,242,8,12,1,13,1,13,1,14,1,14,1,15,1,
15,1,16,1,16,1,17,1,17,1,18,1,18,1,18,1,18,1,18,4,18,259,8,18,11,18,12,18,
260,1,19,1,19,1,19,1,19,1,19,4,19,268,8,19,11,19,12,19,269,1,20,1,20,1,20,
1,21,1,21,1,21,1,22,1,22,1,22,3,22,281,8,22,4,22,283,8,22,11,22,12,22,284,
1,23,1,23,4,23,289,8,23,11,23,12,23,290,1,24,1,24,4,24,295,8,24,11,24,12,
24,296,1,25,1,25,1,26,1,26,1,27,5,27,304,8,27,10,27,12,27,307,9,27,1,27,
2,290,296,0,28,0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,
42,44,46,48,50,52,54,0,2,4,0,3,4,7,7,13,14,16,16,1,0,5,6,318,0,59,1,0,0,
0,2,176,1,0,0,0,4,180,1,0,0,0,6,182,1,0,0,0,8,184,1,0,0,0,10,186,1,0,0,0,
12,188,1,0,0,0,14,190,1,0,0,0,16,192,1,0,0,0,18,194,1,0,0,0,20,196,1,0,0,
0,22,221,1,0,0,0,24,225,1,0,0,0,26,243,1,0,0,0,28,245,1,0,0,0,30,247,1,0,
0,0,32,249,1,0,0,0,34,251,1,0,0,0,36,258,1,0,0,0,38,267,1,0,0,0,40,271,1,
0,0,0,42,274,1,0,0,0,44,282,1,0,0,0,46,288,1,0,0,0,48,294,1,0,0,0,50,298,
1,0,0,0,52,300,1,0,0,0,54,305,1,0,0,0,56,57,3,2,1,0,57,58,3,54,27,0,58,60,
1,0,0,0,59,56,1,0,0,0,59,60,1,0,0,0,60,61,1,0,0,0,61,62,5,14,0,0,62,63,3,
4,2,0,63,64,5,6,0,0,64,73,3,54,27,0,65,66,5,8,0,0,66,69,3,6,3,0,67,68,5,
5,0,0,68,70,5,11,0,0,69,67,1,0,0,0,69,70,1,0,0,0,70,71,1,0,0,0,71,72,3,54,
27,0,72,74,1,0,0,0,73,65,1,0,0,0,73,74,1,0,0,0,74,83,1,0,0,0,75,76,5,10,
0,0,76,79,3,8,4,0,77,78,5,5,0,0,78,80,5,11,0,0,79,77,1,0,0,0,79,80,1,0,0,
0,80,81,1,0,0,0,81,82,3,54,27,0,82,84,1,0,0,0,83,75,1,0,0,0,83,84,1,0,0,
0,84,94,1,0,0,0,85,86,5,9,0,0,86,89,3,10,5,0,87,88,5,5,0,0,88,90,5,11,0,
0,89,87,1,0,0,0,89,90,1,0,0,0,90,91,1,0,0,0,91,92,5,6,0,0,92,93,3,54,27,
0,93,95,1,0,0,0,94,85,1,0,0,0,94,95,1,0,0,0,95,104,1,0,0,0,96,97,5,12,0,
0,97,100,3,12,6,0,98,99,5,5,0,0,99,101,5,11,0,0,100,98,1,0,0,0,100,101,1,
0,0,0,101,102,1,0,0,0,102,103,3,54,27,0,103,105,1,0,0,0,104,96,1,0,0,0,104,
105,1,0,0,0,105,108,1,0,0,0,106,107,5,17,0,0,107,109,3,54,27,0,108,106,1,
0,0,0,108,109,1,0,0,0,109,114,1,0,0,0,110,111,5,6,0,0,111,112,3,14,7,0,112,
113,3,54,27,0,113,115,1,0,0,0,114,110,1,0,0,0,114,115,1,0,0,0,115,125,1,
0,0,0,116,119,5,18,0,0,117,118,5,5,0,0,118,120,5,11,0,0,119,117,1,0,0,0,
119,120,1,0,0,0,120,121,1,0,0,0,121,122,3,54,27,0,122,123,3,16,8,0,123,124,
3,54,27,0,124,126,1,0,0,0,125,116,1,0,0,0,125,126,1,0,0,0,126,132,1,0,0,
0,127,128,5,19,0,0,128,129,3,54,27,0,129,130,3,18,9,0,130,131,3,54,27,0,
131,133,1,0,0,0,132,127,1,0,0,0,132,133,1,0,0,0,133,139,1,0,0,0,134,135,
5,20,0,0,135,136,3,54,27,0,136,137,3,20,10,0,137,138,3,54,27,0,138,140,1,
0,0,0,139,134,1,0,0,0,139,140,1,0,0,0,140,150,1,0,0,0,141,144,5,23,0,0,142,
143,5,5,0,0,143,145,5,11,0,0,144,142,1,0,0,0,144,145,1,0,0,0,145,146,1,0,
0,0,146,147,3,54,27,0,147,148,3,22,11,0,148,149,3,54,27,0,149,151,1,0,0,
0,150,141,1,0,0,0,150,151,1,0,0,0,151,161,1,0,0,0,152,155,5,24,0,0,153,154,
5,5,0,0,154,156,5,11,0,0,155,153,1,0,0,0,155,156,1,0,0,0,156,157,1,0,0,0,
157,158,3,54,27,0,158,159,3,40,20,0,159,160,3,54,27,0,160,162,1,0,0,0,161,
152,1,0,0,0,161,162,1,0,0,0,162,172,1,0,0,0,163,166,5,25,0,0,164,165,5,5,
0,0,165,167,5,11,0,0,166,164,1,0,0,0,166,167,1,0,0,0,167,168,1,0,0,0,168,
169,3,54,27,0,169,170,3,42,21,0,170,171,3,54,27,0,171,173,1,0,0,0,172,163,
1,0,0,0,172,173,1,0,0,0,173,174,1,0,0,0,174,175,5,0,0,1,175,1,1,0,0,0,176,
177,5,13,0,0,177,178,3,48,24,0,178,179,5,13,0,0,179,3,1,0,0,0,180,181,3,
46,23,0,181,5,1,0,0,0,182,183,3,46,23,0,183,7,1,0,0,0,184,185,3,46,23,0,
185,9,1,0,0,0,186,187,3,46,23,0,187,11,1,0,0,0,188,189,3,46,23,0,189,13,
1,0,0,0,190,191,3,48,24,0,191,15,1,0,0,0,192,193,3,44,22,0,193,17,1,0,0,
0,194,195,3,44,22,0,195,19,1,0,0,0,196,197,3,54,27,0,197,206,3,26,13,0,198,
199,3,54,27,0,199,202,5,21,0,0,200,201,5,5,0,0,201,203,5,11,0,0,202,200,
1,0,0,0,202,203,1,0,0,0,203,204,1,0,0,0,204,205,3,28,14,0,205,207,1,0,0,
0,206,198,1,0,0,0,206,207,1,0,0,0,207,216,1,0,0,0,208,209,3,54,27,0,209,
212,5,22,0,0,210,211,5,5,0,0,211,213,5,11,0,0,212,210,1,0,0,0,212,213,1,
0,0,0,213,214,1,0,0,0,214,215,3,30,15,0,215,217,1,0,0,0,216,208,1,0,0,0,
216,217,1,0,0,0,217,21,1,0,0,0,218,219,3,24,12,0,219,220,3,54,27,0,220,222,
1,0,0,0,221,218,1,0,0,0,222,223,1,0,0,0,223,221,1,0,0,0,223,224,1,0,0,0,
224,23,1,0,0,0,225,226,5,15,0,0,226,227,3,32,16,0,227,231,5,6,0,0,228,229,
3,54,27,0,229,230,3,34,17,0,230,232,1,0,0,0,231,228,1,0,0,0,231,232,1,0,
0,0,232,236,1,0,0,0,233,234,3,54,27,0,234,235,3,36,18,0,235,237,1,0,0,0,
236,233,1,0,0,0,236,237,1,0,0,0,237,241,1,0,0,0,238,239,3,54,27,0,239,240,
3,38,19,0,240,242,1,0,0,0,241,238,1,0,0,0,241,242,1,0,0,0,242,25,1,0,0,0,
243,244,3,48,24,0,244,27,1,0,0,0,245,246,3,44,22,0,246,29,1,0,0,0,247,248,
3,44,22,0,248,31,1,0,0,0,249,250,3,46,23,0,250,33,1,0,0,0,251,252,3,48,24,
0,252,35,1,0,0,0,253,254,3,54,27,0,254,255,5,7,0,0,255,256,5,1,0,0,256,257,
3,46,23,0,257,259,1,0,0,0,258,253,1,0,0,0,259,260,1,0,0,0,260,258,1,0,0,
0,260,261,1,0,0,0,261,37,1,0,0,0,262,263,3,54,27,0,263,264,5,7,0,0,264,265,
5,2,0,0,265,266,3,46,23,0,266,268,1,0,0,0,267,262,1,0,0,0,268,269,1,0,0,
0,269,267,1,0,0,0,269,270,1,0,0,0,270,39,1,0,0,0,271,272,3,44,22,0,272,273,
3,54,27,0,273,41,1,0,0,0,274,275,3,44,22,0,275,276,3,54,27,0,276,43,1,0,
0,0,277,278,3,54,27,0,278,280,5,7,0,0,279,281,3,46,23,0,280,279,1,0,0,0,
280,281,1,0,0,0,281,283,1,0,0,0,282,277,1,0,0,0,283,284,1,0,0,0,284,282,
1,0,0,0,284,285,1,0,0,0,285,45,1,0,0,0,286,289,3,50,25,0,287,289,5,5,0,0,
288,286,1,0,0,0,288,287,1,0,0,0,289,290,1,0,0,0,290,291,1,0,0,0,290,288,
1,0,0,0,291,47,1,0,0,0,292,295,3,50,25,0,293,295,3,52,26,0,294,292,1,0,0,
0,294,293,1,0,0,0,295,296,1,0,0,0,296,297,1,0,0,0,296,294,1,0,0,0,297,49,
1,0,0,0,298,299,7,0,0,0,299,51,1,0,0,0,300,301,7,1,0,0,301,53,1,0,0,0,302,
304,3,52,26,0,303,302,1,0,0,0,304,307,1,0,0,0,305,303,1,0,0,0,305,306,1,
0,0,0,306,55,1,0,0,0,307,305,1,0,0,0,38,59,69,73,79,83,89,94,100,104,108,
114,119,125,132,139,144,150,155,161,166,172,202,206,212,216,223,231,236,
241,260,269,280,284,288,290,294,296,305];


const atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

const decisionsToDFA = atn.decisionToState.map( (ds, index) => new antlr4.dfa.DFA(ds, index) );

const sharedContextCache = new antlr4.atn.PredictionContextCache();

export default class MADRParser extends antlr4.Parser {

    static grammarFileName = "MADR.g4";
    static literalNames = [ null, "'Good, because '", "'Bad, because '", 
                            null, null, null, null, null, null, null, null, 
                            "'<!-- optional -->'", null, null, "'# '" ];
    static symbolicNames = [ null, null, null, "WORD", "CHARACTER", "WS", 
                             "NEWLINE", "LIST_MARKER", "STATUS_MARKER", 
                             "DATE_MARKER", "DECIDERS_MARKER", "OPTIONAL_MAKER", 
                             "TECHNICAL_STORY_MARKER", "YAML_MARKER", "HEADING_PREFIX", 
                             "SUBSUBHEADING_PREFIX", "SUBSUBSUBHEADING_PREFIX", 
                             "CONTEXT_AND_PROBLEM_STATEMENT", "DECISION_DRIVERS_HEADING", 
                             "CONSIDERED_OPTIONS_HEADING", "DECISION_OUTCOME_HEADING", 
                             "POSITIVE_CONSEQUENCES_HEADING", "NEGATIVE_CONSEQUENCES_HEADING", 
                             "PROS_AND_CONS_OF_THE_OPTIONS_HEADING", "LINKS_HEADING", 
                             "RELEVANT_FILES_HEADING" ];
    static ruleNames = [ "start", "yaml", "title", "status", "deciders", 
                         "date", "technicalStory", "contextAndProblemStatement", 
                         "decisionDrivers", "consideredOptions", "decisionOutcome", 
                         "prosAndConsOfOptions", "optionSection", "chosenOptionAndExplanation", 
                         "positiveConsequences", "negativeConsequences", 
                         "optionTitle", "optionDescription", "prolist", 
                         "conlist", "links", "relevantFiles", "list", "textLine", 
                         "multilineText", "any", "wslb", "wslbs" ];

    constructor(input) {
        super(input);
        this._interp = new antlr4.atn.ParserATNSimulator(this, atn, decisionsToDFA, sharedContextCache);
        this.ruleNames = MADRParser.ruleNames;
        this.literalNames = MADRParser.literalNames;
        this.symbolicNames = MADRParser.symbolicNames;
    }



	start() {
	    let localctx = new StartContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 0, MADRParser.RULE_start);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 59;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if(_la===13) {
	            this.state = 56;
	            this.yaml();
	            this.state = 57;
	            this.wslbs();
	        }

	        this.state = 61;
	        this.match(MADRParser.HEADING_PREFIX);
	        this.state = 62;
	        this.title();
	        this.state = 63;
	        this.match(MADRParser.NEWLINE);
	        this.state = 64;
	        this.wslbs();
	        this.state = 73;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if(_la===8) {
	            this.state = 65;
	            this.match(MADRParser.STATUS_MARKER);
	            this.state = 66;
	            this.status();
	            this.state = 69;
	            this._errHandler.sync(this);
	            var la_ = this._interp.adaptivePredict(this._input,1,this._ctx);
	            if(la_===1) {
	                this.state = 67;
	                this.match(MADRParser.WS);
	                this.state = 68;
	                this.match(MADRParser.OPTIONAL_MAKER);

	            }
	            this.state = 71;
	            this.wslbs();
	        }

	        this.state = 83;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if(_la===10) {
	            this.state = 75;
	            this.match(MADRParser.DECIDERS_MARKER);
	            this.state = 76;
	            this.deciders();
	            this.state = 79;
	            this._errHandler.sync(this);
	            var la_ = this._interp.adaptivePredict(this._input,3,this._ctx);
	            if(la_===1) {
	                this.state = 77;
	                this.match(MADRParser.WS);
	                this.state = 78;
	                this.match(MADRParser.OPTIONAL_MAKER);

	            }
	            this.state = 81;
	            this.wslbs();
	        }

	        this.state = 94;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if(_la===9) {
	            this.state = 85;
	            this.match(MADRParser.DATE_MARKER);
	            this.state = 86;
	            this.date();
	            this.state = 89;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	            if(_la===5) {
	                this.state = 87;
	                this.match(MADRParser.WS);
	                this.state = 88;
	                this.match(MADRParser.OPTIONAL_MAKER);
	            }

	            this.state = 91;
	            this.match(MADRParser.NEWLINE);
	            this.state = 92;
	            this.wslbs();
	        }

	        this.state = 104;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if(_la===12) {
	            this.state = 96;
	            this.match(MADRParser.TECHNICAL_STORY_MARKER);
	            this.state = 97;
	            this.technicalStory();
	            this.state = 100;
	            this._errHandler.sync(this);
	            var la_ = this._interp.adaptivePredict(this._input,7,this._ctx);
	            if(la_===1) {
	                this.state = 98;
	                this.match(MADRParser.WS);
	                this.state = 99;
	                this.match(MADRParser.OPTIONAL_MAKER);

	            }
	            this.state = 102;
	            this.wslbs();
	        }

	        this.state = 108;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if(_la===17) {
	            this.state = 106;
	            this.match(MADRParser.CONTEXT_AND_PROBLEM_STATEMENT);
	            this.state = 107;
	            this.wslbs();
	        }

	        this.state = 114;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if(_la===6) {
	            this.state = 110;
	            this.match(MADRParser.NEWLINE);
	            this.state = 111;
	            this.contextAndProblemStatement();
	            this.state = 112;
	            this.wslbs();
	        }

	        this.state = 125;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if(_la===18) {
	            this.state = 116;
	            this.match(MADRParser.DECISION_DRIVERS_HEADING);
	            this.state = 119;
	            this._errHandler.sync(this);
	            var la_ = this._interp.adaptivePredict(this._input,11,this._ctx);
	            if(la_===1) {
	                this.state = 117;
	                this.match(MADRParser.WS);
	                this.state = 118;
	                this.match(MADRParser.OPTIONAL_MAKER);

	            }
	            this.state = 121;
	            this.wslbs();
	            this.state = 122;
	            this.decisionDrivers();
	            this.state = 123;
	            this.wslbs();
	        }

	        this.state = 132;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if(_la===19) {
	            this.state = 127;
	            this.match(MADRParser.CONSIDERED_OPTIONS_HEADING);
	            this.state = 128;
	            this.wslbs();
	            this.state = 129;
	            this.consideredOptions();
	            this.state = 130;
	            this.wslbs();
	        }

	        this.state = 139;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if(_la===20) {
	            this.state = 134;
	            this.match(MADRParser.DECISION_OUTCOME_HEADING);
	            this.state = 135;
	            this.wslbs();
	            this.state = 136;
	            this.decisionOutcome();
	            this.state = 137;
	            this.wslbs();
	        }

	        this.state = 150;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if(_la===23) {
	            this.state = 141;
	            this.match(MADRParser.PROS_AND_CONS_OF_THE_OPTIONS_HEADING);
	            this.state = 144;
	            this._errHandler.sync(this);
	            var la_ = this._interp.adaptivePredict(this._input,15,this._ctx);
	            if(la_===1) {
	                this.state = 142;
	                this.match(MADRParser.WS);
	                this.state = 143;
	                this.match(MADRParser.OPTIONAL_MAKER);

	            }
	            this.state = 146;
	            this.wslbs();
	            this.state = 147;
	            this.prosAndConsOfOptions();
	            this.state = 148;
	            this.wslbs();
	        }

	        this.state = 161;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if(_la===24) {
	            this.state = 152;
	            this.match(MADRParser.LINKS_HEADING);
	            this.state = 155;
	            this._errHandler.sync(this);
	            var la_ = this._interp.adaptivePredict(this._input,17,this._ctx);
	            if(la_===1) {
	                this.state = 153;
	                this.match(MADRParser.WS);
	                this.state = 154;
	                this.match(MADRParser.OPTIONAL_MAKER);

	            }
	            this.state = 157;
	            this.wslbs();
	            this.state = 158;
	            this.links();
	            this.state = 159;
	            this.wslbs();
	        }

	        this.state = 172;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if(_la===25) {
	            this.state = 163;
	            this.match(MADRParser.RELEVANT_FILES_HEADING);
	            this.state = 166;
	            this._errHandler.sync(this);
	            var la_ = this._interp.adaptivePredict(this._input,19,this._ctx);
	            if(la_===1) {
	                this.state = 164;
	                this.match(MADRParser.WS);
	                this.state = 165;
	                this.match(MADRParser.OPTIONAL_MAKER);

	            }
	            this.state = 168;
	            this.wslbs();
	            this.state = 169;
	            this.relevantFiles();
	            this.state = 170;
	            this.wslbs();
	        }

	        this.state = 174;
	        this.match(MADRParser.EOF);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	yaml() {
	    let localctx = new YamlContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 2, MADRParser.RULE_yaml);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 176;
	        this.match(MADRParser.YAML_MARKER);
	        this.state = 177;
	        this.multilineText();
	        this.state = 178;
	        this.match(MADRParser.YAML_MARKER);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	title() {
	    let localctx = new TitleContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 4, MADRParser.RULE_title);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 180;
	        this.textLine();
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	status() {
	    let localctx = new StatusContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 6, MADRParser.RULE_status);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 182;
	        this.textLine();
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	deciders() {
	    let localctx = new DecidersContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 8, MADRParser.RULE_deciders);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 184;
	        this.textLine();
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	date() {
	    let localctx = new DateContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 10, MADRParser.RULE_date);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 186;
	        this.textLine();
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	technicalStory() {
	    let localctx = new TechnicalStoryContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 12, MADRParser.RULE_technicalStory);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 188;
	        this.textLine();
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	contextAndProblemStatement() {
	    let localctx = new ContextAndProblemStatementContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 14, MADRParser.RULE_contextAndProblemStatement);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 190;
	        this.multilineText();
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	decisionDrivers() {
	    let localctx = new DecisionDriversContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 16, MADRParser.RULE_decisionDrivers);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 192;
	        this.list();
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	consideredOptions() {
	    let localctx = new ConsideredOptionsContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 18, MADRParser.RULE_consideredOptions);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 194;
	        this.list();
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	decisionOutcome() {
	    let localctx = new DecisionOutcomeContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 20, MADRParser.RULE_decisionOutcome);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 196;
	        this.wslbs();
	        this.state = 197;
	        this.chosenOptionAndExplanation();
	        this.state = 206;
	        this._errHandler.sync(this);
	        var la_ = this._interp.adaptivePredict(this._input,22,this._ctx);
	        if(la_===1) {
	            this.state = 198;
	            this.wslbs();
	            this.state = 199;
	            this.match(MADRParser.POSITIVE_CONSEQUENCES_HEADING);
	            this.state = 202;
	            this._errHandler.sync(this);
	            var la_ = this._interp.adaptivePredict(this._input,21,this._ctx);
	            if(la_===1) {
	                this.state = 200;
	                this.match(MADRParser.WS);
	                this.state = 201;
	                this.match(MADRParser.OPTIONAL_MAKER);

	            }
	            this.state = 204;
	            this.positiveConsequences();

	        }
	        this.state = 216;
	        this._errHandler.sync(this);
	        var la_ = this._interp.adaptivePredict(this._input,24,this._ctx);
	        if(la_===1) {
	            this.state = 208;
	            this.wslbs();
	            this.state = 209;
	            this.match(MADRParser.NEGATIVE_CONSEQUENCES_HEADING);
	            this.state = 212;
	            this._errHandler.sync(this);
	            var la_ = this._interp.adaptivePredict(this._input,23,this._ctx);
	            if(la_===1) {
	                this.state = 210;
	                this.match(MADRParser.WS);
	                this.state = 211;
	                this.match(MADRParser.OPTIONAL_MAKER);

	            }
	            this.state = 214;
	            this.negativeConsequences();

	        }
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	prosAndConsOfOptions() {
	    let localctx = new ProsAndConsOfOptionsContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 22, MADRParser.RULE_prosAndConsOfOptions);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 221; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 218;
	            this.optionSection();
	            this.state = 219;
	            this.wslbs();
	            this.state = 223; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===15);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	optionSection() {
	    let localctx = new OptionSectionContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 24, MADRParser.RULE_optionSection);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 225;
	        this.match(MADRParser.SUBSUBHEADING_PREFIX);
	        this.state = 226;
	        this.optionTitle();
	        this.state = 227;
	        this.match(MADRParser.NEWLINE);
	        this.state = 231;
	        this._errHandler.sync(this);
	        var la_ = this._interp.adaptivePredict(this._input,26,this._ctx);
	        if(la_===1) {
	            this.state = 228;
	            this.wslbs();
	            this.state = 229;
	            this.optionDescription();

	        }
	        this.state = 236;
	        this._errHandler.sync(this);
	        var la_ = this._interp.adaptivePredict(this._input,27,this._ctx);
	        if(la_===1) {
	            this.state = 233;
	            this.wslbs();
	            this.state = 234;
	            this.prolist();

	        }
	        this.state = 241;
	        this._errHandler.sync(this);
	        var la_ = this._interp.adaptivePredict(this._input,28,this._ctx);
	        if(la_===1) {
	            this.state = 238;
	            this.wslbs();
	            this.state = 239;
	            this.conlist();

	        }
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	chosenOptionAndExplanation() {
	    let localctx = new ChosenOptionAndExplanationContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 26, MADRParser.RULE_chosenOptionAndExplanation);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 243;
	        this.multilineText();
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	positiveConsequences() {
	    let localctx = new PositiveConsequencesContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 28, MADRParser.RULE_positiveConsequences);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 245;
	        this.list();
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	negativeConsequences() {
	    let localctx = new NegativeConsequencesContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 30, MADRParser.RULE_negativeConsequences);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 247;
	        this.list();
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	optionTitle() {
	    let localctx = new OptionTitleContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 32, MADRParser.RULE_optionTitle);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 249;
	        this.textLine();
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	optionDescription() {
	    let localctx = new OptionDescriptionContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 34, MADRParser.RULE_optionDescription);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 251;
	        this.multilineText();
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	prolist() {
	    let localctx = new ProlistContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 36, MADRParser.RULE_prolist);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 258; 
	        this._errHandler.sync(this);
	        var _alt = 1;
	        do {
	        	switch (_alt) {
	        	case 1:
	        		this.state = 253;
	        		this.wslbs();
	        		this.state = 254;
	        		this.match(MADRParser.LIST_MARKER);
	        		this.state = 255;
	        		this.match(MADRParser.T__0);
	        		this.state = 256;
	        		this.textLine();
	        		break;
	        	default:
	        		throw new antlr4.error.NoViableAltException(this);
	        	}
	        	this.state = 260; 
	        	this._errHandler.sync(this);
	        	_alt = this._interp.adaptivePredict(this._input,29, this._ctx);
	        } while ( _alt!=2 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER );
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	conlist() {
	    let localctx = new ConlistContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 38, MADRParser.RULE_conlist);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 267; 
	        this._errHandler.sync(this);
	        var _alt = 1;
	        do {
	        	switch (_alt) {
	        	case 1:
	        		this.state = 262;
	        		this.wslbs();
	        		this.state = 263;
	        		this.match(MADRParser.LIST_MARKER);
	        		this.state = 264;
	        		this.match(MADRParser.T__1);
	        		this.state = 265;
	        		this.textLine();
	        		break;
	        	default:
	        		throw new antlr4.error.NoViableAltException(this);
	        	}
	        	this.state = 269; 
	        	this._errHandler.sync(this);
	        	_alt = this._interp.adaptivePredict(this._input,30, this._ctx);
	        } while ( _alt!=2 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER );
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	links() {
	    let localctx = new LinksContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 40, MADRParser.RULE_links);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 271;
	        this.list();
	        this.state = 272;
	        this.wslbs();
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	relevantFiles() {
	    let localctx = new RelevantFilesContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 42, MADRParser.RULE_relevantFiles);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 274;
	        this.list();
	        this.state = 275;
	        this.wslbs();
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	list() {
	    let localctx = new ListContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 44, MADRParser.RULE_list);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 282; 
	        this._errHandler.sync(this);
	        var _alt = 1;
	        do {
	        	switch (_alt) {
	        	case 1:
	        		this.state = 277;
	        		this.wslbs();
	        		this.state = 278;
	        		this.match(MADRParser.LIST_MARKER);
	        		this.state = 280;
	        		this._errHandler.sync(this);
	        		var la_ = this._interp.adaptivePredict(this._input,31,this._ctx);
	        		if(la_===1) {
	        		    this.state = 279;
	        		    this.textLine();

	        		}
	        		break;
	        	default:
	        		throw new antlr4.error.NoViableAltException(this);
	        	}
	        	this.state = 284; 
	        	this._errHandler.sync(this);
	        	_alt = this._interp.adaptivePredict(this._input,32, this._ctx);
	        } while ( _alt!=2 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER );
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	textLine() {
	    let localctx = new TextLineContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 46, MADRParser.RULE_textLine);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 288; 
	        this._errHandler.sync(this);
	        var _alt = 1+1;
	        do {
	        	switch (_alt) {
	        	case 1+1:
	        		this.state = 288;
	        		this._errHandler.sync(this);
	        		switch(this._input.LA(1)) {
	        		case 3:
	        		case 4:
	        		case 7:
	        		case 13:
	        		case 14:
	        		case 16:
	        		    this.state = 286;
	        		    this.any();
	        		    break;
	        		case 5:
	        		    this.state = 287;
	        		    this.match(MADRParser.WS);
	        		    break;
	        		default:
	        		    throw new antlr4.error.NoViableAltException(this);
	        		}
	        		break;
	        	default:
	        		throw new antlr4.error.NoViableAltException(this);
	        	}
	        	this.state = 290; 
	        	this._errHandler.sync(this);
	        	_alt = this._interp.adaptivePredict(this._input,34, this._ctx);
	        } while ( _alt!=1 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER );
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	multilineText() {
	    let localctx = new MultilineTextContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 48, MADRParser.RULE_multilineText);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 294; 
	        this._errHandler.sync(this);
	        var _alt = 1+1;
	        do {
	        	switch (_alt) {
	        	case 1+1:
	        		this.state = 294;
	        		this._errHandler.sync(this);
	        		switch(this._input.LA(1)) {
	        		case 3:
	        		case 4:
	        		case 7:
	        		case 13:
	        		case 14:
	        		case 16:
	        		    this.state = 292;
	        		    this.any();
	        		    break;
	        		case 5:
	        		case 6:
	        		    this.state = 293;
	        		    this.wslb();
	        		    break;
	        		default:
	        		    throw new antlr4.error.NoViableAltException(this);
	        		}
	        		break;
	        	default:
	        		throw new antlr4.error.NoViableAltException(this);
	        	}
	        	this.state = 296; 
	        	this._errHandler.sync(this);
	        	_alt = this._interp.adaptivePredict(this._input,36, this._ctx);
	        } while ( _alt!=1 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER );
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	any() {
	    let localctx = new AnyContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 50, MADRParser.RULE_any);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 298;
	        _la = this._input.LA(1);
	        if(!((((_la) & ~0x1f) === 0 && ((1 << _la) & 90264) !== 0))) {
	        this._errHandler.recoverInline(this);
	        }
	        else {
	        	this._errHandler.reportMatch(this);
	            this.consume();
	        }
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	wslb() {
	    let localctx = new WslbContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 52, MADRParser.RULE_wslb);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 300;
	        _la = this._input.LA(1);
	        if(!(_la===5 || _la===6)) {
	        this._errHandler.recoverInline(this);
	        }
	        else {
	        	this._errHandler.reportMatch(this);
	            this.consume();
	        }
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	wslbs() {
	    let localctx = new WslbsContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 54, MADRParser.RULE_wslbs);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 305;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input,37,this._ctx)
	        while(_alt!=2 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if(_alt===1) {
	                this.state = 302;
	                this.wslb(); 
	            }
	            this.state = 307;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input,37,this._ctx);
	        }

	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}


}

MADRParser.EOF = antlr4.Token.EOF;
MADRParser.T__0 = 1;
MADRParser.T__1 = 2;
MADRParser.WORD = 3;
MADRParser.CHARACTER = 4;
MADRParser.WS = 5;
MADRParser.NEWLINE = 6;
MADRParser.LIST_MARKER = 7;
MADRParser.STATUS_MARKER = 8;
MADRParser.DATE_MARKER = 9;
MADRParser.DECIDERS_MARKER = 10;
MADRParser.OPTIONAL_MAKER = 11;
MADRParser.TECHNICAL_STORY_MARKER = 12;
MADRParser.YAML_MARKER = 13;
MADRParser.HEADING_PREFIX = 14;
MADRParser.SUBSUBHEADING_PREFIX = 15;
MADRParser.SUBSUBSUBHEADING_PREFIX = 16;
MADRParser.CONTEXT_AND_PROBLEM_STATEMENT = 17;
MADRParser.DECISION_DRIVERS_HEADING = 18;
MADRParser.CONSIDERED_OPTIONS_HEADING = 19;
MADRParser.DECISION_OUTCOME_HEADING = 20;
MADRParser.POSITIVE_CONSEQUENCES_HEADING = 21;
MADRParser.NEGATIVE_CONSEQUENCES_HEADING = 22;
MADRParser.PROS_AND_CONS_OF_THE_OPTIONS_HEADING = 23;
MADRParser.LINKS_HEADING = 24;
MADRParser.RELEVANT_FILES_HEADING = 25;

MADRParser.RULE_start = 0;
MADRParser.RULE_yaml = 1;
MADRParser.RULE_title = 2;
MADRParser.RULE_status = 3;
MADRParser.RULE_deciders = 4;
MADRParser.RULE_date = 5;
MADRParser.RULE_technicalStory = 6;
MADRParser.RULE_contextAndProblemStatement = 7;
MADRParser.RULE_decisionDrivers = 8;
MADRParser.RULE_consideredOptions = 9;
MADRParser.RULE_decisionOutcome = 10;
MADRParser.RULE_prosAndConsOfOptions = 11;
MADRParser.RULE_optionSection = 12;
MADRParser.RULE_chosenOptionAndExplanation = 13;
MADRParser.RULE_positiveConsequences = 14;
MADRParser.RULE_negativeConsequences = 15;
MADRParser.RULE_optionTitle = 16;
MADRParser.RULE_optionDescription = 17;
MADRParser.RULE_prolist = 18;
MADRParser.RULE_conlist = 19;
MADRParser.RULE_links = 20;
MADRParser.RULE_relevantFiles = 21;
MADRParser.RULE_list = 22;
MADRParser.RULE_textLine = 23;
MADRParser.RULE_multilineText = 24;
MADRParser.RULE_any = 25;
MADRParser.RULE_wslb = 26;
MADRParser.RULE_wslbs = 27;

class StartContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_start;
    }

	HEADING_PREFIX() {
	    return this.getToken(MADRParser.HEADING_PREFIX, 0);
	};

	title() {
	    return this.getTypedRuleContext(TitleContext,0);
	};

	NEWLINE = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(MADRParser.NEWLINE);
	    } else {
	        return this.getToken(MADRParser.NEWLINE, i);
	    }
	};


	wslbs = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(WslbsContext);
	    } else {
	        return this.getTypedRuleContext(WslbsContext,i);
	    }
	};

	EOF() {
	    return this.getToken(MADRParser.EOF, 0);
	};

	yaml() {
	    return this.getTypedRuleContext(YamlContext,0);
	};

	STATUS_MARKER() {
	    return this.getToken(MADRParser.STATUS_MARKER, 0);
	};

	status() {
	    return this.getTypedRuleContext(StatusContext,0);
	};

	DECIDERS_MARKER() {
	    return this.getToken(MADRParser.DECIDERS_MARKER, 0);
	};

	deciders() {
	    return this.getTypedRuleContext(DecidersContext,0);
	};

	DATE_MARKER() {
	    return this.getToken(MADRParser.DATE_MARKER, 0);
	};

	date() {
	    return this.getTypedRuleContext(DateContext,0);
	};

	TECHNICAL_STORY_MARKER() {
	    return this.getToken(MADRParser.TECHNICAL_STORY_MARKER, 0);
	};

	technicalStory() {
	    return this.getTypedRuleContext(TechnicalStoryContext,0);
	};

	CONTEXT_AND_PROBLEM_STATEMENT() {
	    return this.getToken(MADRParser.CONTEXT_AND_PROBLEM_STATEMENT, 0);
	};

	contextAndProblemStatement() {
	    return this.getTypedRuleContext(ContextAndProblemStatementContext,0);
	};

	DECISION_DRIVERS_HEADING() {
	    return this.getToken(MADRParser.DECISION_DRIVERS_HEADING, 0);
	};

	decisionDrivers() {
	    return this.getTypedRuleContext(DecisionDriversContext,0);
	};

	CONSIDERED_OPTIONS_HEADING() {
	    return this.getToken(MADRParser.CONSIDERED_OPTIONS_HEADING, 0);
	};

	consideredOptions() {
	    return this.getTypedRuleContext(ConsideredOptionsContext,0);
	};

	DECISION_OUTCOME_HEADING() {
	    return this.getToken(MADRParser.DECISION_OUTCOME_HEADING, 0);
	};

	decisionOutcome() {
	    return this.getTypedRuleContext(DecisionOutcomeContext,0);
	};

	PROS_AND_CONS_OF_THE_OPTIONS_HEADING() {
	    return this.getToken(MADRParser.PROS_AND_CONS_OF_THE_OPTIONS_HEADING, 0);
	};

	prosAndConsOfOptions() {
	    return this.getTypedRuleContext(ProsAndConsOfOptionsContext,0);
	};

	LINKS_HEADING() {
	    return this.getToken(MADRParser.LINKS_HEADING, 0);
	};

	links() {
	    return this.getTypedRuleContext(LinksContext,0);
	};

	RELEVANT_FILES_HEADING() {
	    return this.getToken(MADRParser.RELEVANT_FILES_HEADING, 0);
	};

	relevantFiles() {
	    return this.getTypedRuleContext(RelevantFilesContext,0);
	};

	WS = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(MADRParser.WS);
	    } else {
	        return this.getToken(MADRParser.WS, i);
	    }
	};


	OPTIONAL_MAKER = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(MADRParser.OPTIONAL_MAKER);
	    } else {
	        return this.getToken(MADRParser.OPTIONAL_MAKER, i);
	    }
	};


	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterStart(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitStart(this);
		}
	}


}



class YamlContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_yaml;
    }

	YAML_MARKER = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(MADRParser.YAML_MARKER);
	    } else {
	        return this.getToken(MADRParser.YAML_MARKER, i);
	    }
	};


	multilineText() {
	    return this.getTypedRuleContext(MultilineTextContext,0);
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterYaml(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitYaml(this);
		}
	}


}



class TitleContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_title;
    }

	textLine() {
	    return this.getTypedRuleContext(TextLineContext,0);
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterTitle(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitTitle(this);
		}
	}


}



class StatusContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_status;
    }

	textLine() {
	    return this.getTypedRuleContext(TextLineContext,0);
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterStatus(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitStatus(this);
		}
	}


}



class DecidersContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_deciders;
    }

	textLine() {
	    return this.getTypedRuleContext(TextLineContext,0);
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterDeciders(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitDeciders(this);
		}
	}


}



class DateContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_date;
    }

	textLine() {
	    return this.getTypedRuleContext(TextLineContext,0);
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterDate(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitDate(this);
		}
	}


}



class TechnicalStoryContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_technicalStory;
    }

	textLine() {
	    return this.getTypedRuleContext(TextLineContext,0);
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterTechnicalStory(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitTechnicalStory(this);
		}
	}


}



class ContextAndProblemStatementContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_contextAndProblemStatement;
    }

	multilineText() {
	    return this.getTypedRuleContext(MultilineTextContext,0);
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterContextAndProblemStatement(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitContextAndProblemStatement(this);
		}
	}


}



class DecisionDriversContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_decisionDrivers;
    }

	list() {
	    return this.getTypedRuleContext(ListContext,0);
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterDecisionDrivers(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitDecisionDrivers(this);
		}
	}


}



class ConsideredOptionsContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_consideredOptions;
    }

	list() {
	    return this.getTypedRuleContext(ListContext,0);
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterConsideredOptions(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitConsideredOptions(this);
		}
	}


}



class DecisionOutcomeContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_decisionOutcome;
    }

	wslbs = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(WslbsContext);
	    } else {
	        return this.getTypedRuleContext(WslbsContext,i);
	    }
	};

	chosenOptionAndExplanation() {
	    return this.getTypedRuleContext(ChosenOptionAndExplanationContext,0);
	};

	POSITIVE_CONSEQUENCES_HEADING() {
	    return this.getToken(MADRParser.POSITIVE_CONSEQUENCES_HEADING, 0);
	};

	positiveConsequences() {
	    return this.getTypedRuleContext(PositiveConsequencesContext,0);
	};

	NEGATIVE_CONSEQUENCES_HEADING() {
	    return this.getToken(MADRParser.NEGATIVE_CONSEQUENCES_HEADING, 0);
	};

	negativeConsequences() {
	    return this.getTypedRuleContext(NegativeConsequencesContext,0);
	};

	WS = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(MADRParser.WS);
	    } else {
	        return this.getToken(MADRParser.WS, i);
	    }
	};


	OPTIONAL_MAKER = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(MADRParser.OPTIONAL_MAKER);
	    } else {
	        return this.getToken(MADRParser.OPTIONAL_MAKER, i);
	    }
	};


	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterDecisionOutcome(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitDecisionOutcome(this);
		}
	}


}



class ProsAndConsOfOptionsContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_prosAndConsOfOptions;
    }

	optionSection = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(OptionSectionContext);
	    } else {
	        return this.getTypedRuleContext(OptionSectionContext,i);
	    }
	};

	wslbs = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(WslbsContext);
	    } else {
	        return this.getTypedRuleContext(WslbsContext,i);
	    }
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterProsAndConsOfOptions(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitProsAndConsOfOptions(this);
		}
	}


}



class OptionSectionContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_optionSection;
    }

	SUBSUBHEADING_PREFIX() {
	    return this.getToken(MADRParser.SUBSUBHEADING_PREFIX, 0);
	};

	optionTitle() {
	    return this.getTypedRuleContext(OptionTitleContext,0);
	};

	NEWLINE() {
	    return this.getToken(MADRParser.NEWLINE, 0);
	};

	wslbs = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(WslbsContext);
	    } else {
	        return this.getTypedRuleContext(WslbsContext,i);
	    }
	};

	optionDescription() {
	    return this.getTypedRuleContext(OptionDescriptionContext,0);
	};

	prolist() {
	    return this.getTypedRuleContext(ProlistContext,0);
	};

	conlist() {
	    return this.getTypedRuleContext(ConlistContext,0);
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterOptionSection(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitOptionSection(this);
		}
	}


}



class ChosenOptionAndExplanationContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_chosenOptionAndExplanation;
    }

	multilineText() {
	    return this.getTypedRuleContext(MultilineTextContext,0);
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterChosenOptionAndExplanation(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitChosenOptionAndExplanation(this);
		}
	}


}



class PositiveConsequencesContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_positiveConsequences;
    }

	list() {
	    return this.getTypedRuleContext(ListContext,0);
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterPositiveConsequences(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitPositiveConsequences(this);
		}
	}


}



class NegativeConsequencesContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_negativeConsequences;
    }

	list() {
	    return this.getTypedRuleContext(ListContext,0);
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterNegativeConsequences(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitNegativeConsequences(this);
		}
	}


}



class OptionTitleContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_optionTitle;
    }

	textLine() {
	    return this.getTypedRuleContext(TextLineContext,0);
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterOptionTitle(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitOptionTitle(this);
		}
	}


}



class OptionDescriptionContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_optionDescription;
    }

	multilineText() {
	    return this.getTypedRuleContext(MultilineTextContext,0);
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterOptionDescription(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitOptionDescription(this);
		}
	}


}



class ProlistContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_prolist;
    }

	wslbs = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(WslbsContext);
	    } else {
	        return this.getTypedRuleContext(WslbsContext,i);
	    }
	};

	LIST_MARKER = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(MADRParser.LIST_MARKER);
	    } else {
	        return this.getToken(MADRParser.LIST_MARKER, i);
	    }
	};


	textLine = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(TextLineContext);
	    } else {
	        return this.getTypedRuleContext(TextLineContext,i);
	    }
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterProlist(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitProlist(this);
		}
	}


}



class ConlistContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_conlist;
    }

	wslbs = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(WslbsContext);
	    } else {
	        return this.getTypedRuleContext(WslbsContext,i);
	    }
	};

	LIST_MARKER = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(MADRParser.LIST_MARKER);
	    } else {
	        return this.getToken(MADRParser.LIST_MARKER, i);
	    }
	};


	textLine = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(TextLineContext);
	    } else {
	        return this.getTypedRuleContext(TextLineContext,i);
	    }
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterConlist(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitConlist(this);
		}
	}


}



class LinksContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_links;
    }

	list() {
	    return this.getTypedRuleContext(ListContext,0);
	};

	wslbs() {
	    return this.getTypedRuleContext(WslbsContext,0);
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterLinks(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitLinks(this);
		}
	}


}



class RelevantFilesContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_relevantFiles;
    }

	list() {
	    return this.getTypedRuleContext(ListContext,0);
	};

	wslbs() {
	    return this.getTypedRuleContext(WslbsContext,0);
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterRelevantFiles(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitRelevantFiles(this);
		}
	}


}



class ListContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_list;
    }

	wslbs = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(WslbsContext);
	    } else {
	        return this.getTypedRuleContext(WslbsContext,i);
	    }
	};

	LIST_MARKER = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(MADRParser.LIST_MARKER);
	    } else {
	        return this.getToken(MADRParser.LIST_MARKER, i);
	    }
	};


	textLine = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(TextLineContext);
	    } else {
	        return this.getTypedRuleContext(TextLineContext,i);
	    }
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterList(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitList(this);
		}
	}


}



class TextLineContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_textLine;
    }

	any = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(AnyContext);
	    } else {
	        return this.getTypedRuleContext(AnyContext,i);
	    }
	};

	WS = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(MADRParser.WS);
	    } else {
	        return this.getToken(MADRParser.WS, i);
	    }
	};


	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterTextLine(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitTextLine(this);
		}
	}


}



class MultilineTextContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_multilineText;
    }

	any = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(AnyContext);
	    } else {
	        return this.getTypedRuleContext(AnyContext,i);
	    }
	};

	wslb = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(WslbContext);
	    } else {
	        return this.getTypedRuleContext(WslbContext,i);
	    }
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterMultilineText(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitMultilineText(this);
		}
	}


}



class AnyContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_any;
    }

	WORD() {
	    return this.getToken(MADRParser.WORD, 0);
	};

	CHARACTER() {
	    return this.getToken(MADRParser.CHARACTER, 0);
	};

	LIST_MARKER() {
	    return this.getToken(MADRParser.LIST_MARKER, 0);
	};

	HEADING_PREFIX() {
	    return this.getToken(MADRParser.HEADING_PREFIX, 0);
	};

	SUBSUBSUBHEADING_PREFIX() {
	    return this.getToken(MADRParser.SUBSUBSUBHEADING_PREFIX, 0);
	};

	YAML_MARKER() {
	    return this.getToken(MADRParser.YAML_MARKER, 0);
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterAny(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitAny(this);
		}
	}


}



class WslbContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_wslb;
    }

	WS() {
	    return this.getToken(MADRParser.WS, 0);
	};

	NEWLINE() {
	    return this.getToken(MADRParser.NEWLINE, 0);
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterWslb(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitWslb(this);
		}
	}


}



class WslbsContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = MADRParser.RULE_wslbs;
    }

	wslb = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(WslbContext);
	    } else {
	        return this.getTypedRuleContext(WslbContext,i);
	    }
	};

	enterRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.enterWslbs(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof MADRListener ) {
	        listener.exitWslbs(this);
		}
	}


}




MADRParser.StartContext = StartContext; 
MADRParser.YamlContext = YamlContext; 
MADRParser.TitleContext = TitleContext; 
MADRParser.StatusContext = StatusContext; 
MADRParser.DecidersContext = DecidersContext; 
MADRParser.DateContext = DateContext; 
MADRParser.TechnicalStoryContext = TechnicalStoryContext; 
MADRParser.ContextAndProblemStatementContext = ContextAndProblemStatementContext; 
MADRParser.DecisionDriversContext = DecisionDriversContext; 
MADRParser.ConsideredOptionsContext = ConsideredOptionsContext; 
MADRParser.DecisionOutcomeContext = DecisionOutcomeContext; 
MADRParser.ProsAndConsOfOptionsContext = ProsAndConsOfOptionsContext; 
MADRParser.OptionSectionContext = OptionSectionContext; 
MADRParser.ChosenOptionAndExplanationContext = ChosenOptionAndExplanationContext; 
MADRParser.PositiveConsequencesContext = PositiveConsequencesContext; 
MADRParser.NegativeConsequencesContext = NegativeConsequencesContext; 
MADRParser.OptionTitleContext = OptionTitleContext; 
MADRParser.OptionDescriptionContext = OptionDescriptionContext; 
MADRParser.ProlistContext = ProlistContext; 
MADRParser.ConlistContext = ConlistContext; 
MADRParser.LinksContext = LinksContext; 
MADRParser.RelevantFilesContext = RelevantFilesContext; 
MADRParser.ListContext = ListContext; 
MADRParser.TextLineContext = TextLineContext; 
MADRParser.MultilineTextContext = MultilineTextContext; 
MADRParser.AnyContext = AnyContext; 
MADRParser.WslbContext = WslbContext; 
MADRParser.WslbsContext = WslbsContext; 
