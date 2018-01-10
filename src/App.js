import React, { Component } from 'react';
import './App.css';

/*Own imports*/
import LineChart from 'react-linechart'; //npm install react-linechart --save
import '../node_modules/react-linechart/dist/styles.css';

import DatePicker from 'react-datepicker'; //npm install react-datepicker --save
import moment from 'moment'; //npm install moment --save

import 'react-datepicker/dist/react-datepicker.css';



let API_KEY = "CXOK71OQTSO3FIY7";
let currency = "euro";
let euroSymbol = "€";
let dollarSymbol = "$";
let euroValue = 0.83;
let disableButtons = false;
let MAX_STOCKS = 50;

//Debug booleans
let debugAll = false;
let debugGraph = false;
let debugDiffDays = false;
let debugAppRender = false;
let debugUpdateUnitValue = false;
let debugSorting = true;

//Because they don't work yet but I might fix it in the future, these things won't be enabled
let graphDatePickerWorks = false;
let sortWorking = false;

//               HOLY SPIRIT OF REACT
//      -> INFORMATION FLOWS UP. NEVER FETCH. <-

/**Todo fix
 * New euro value is currently not used when fetching from localStorage
 *      because localStorage is faster than the response for the eurovalue
 *      Idea: always push latest euroValue to localStorage.
 *
 * Todo feature
 * Sorting
 *
 * Todo bonus
 * Make the buttons appear in the right positions
 *
 * Todo should work...
 * Currently stock value is only fetched once and stays the same.
 *      Addition: fetch new value for each stock when loading page.
 *      Idea: keep track of all used unit values as JSON object: [{name: "MSFT", unit_value: 13.37}, {name: "AAPL", unit_value: 0.01}, etc.]
 * Currency switcher doesn't work inside the table. Only on total value.
 *
 * Todo dun did
 * Performance graph. (Prompt which interval when clicking it? Radio buttons for intervals?
 *                      Straight up fetch daily, weekly, monthly, yearly or all time from API.)
 * Date picker for performance graph
 * Add portfolio
 * Add stock
 * Total value is currently NaN€ instead of 0€*
 * Remove selected stock.
 * Remove portfolio
 * Make it reacty
 * Store in local storage.
 */





class App extends Component {
    loaded = false;
    graphDataStorage = [];

    constructor(props){
        super(props);
        let portfolios = [];
        let jsPortfolios = {};

        this.state = {
            portfolios: portfolios,
            jsPortfolios: jsPortfolios,
            graph: undefined,
            graphLines: [],
            graphLinesTotal: 0,
            graphLinesCount: 0,
        }
    }
    updateEuroValue(jsonObj){
        console.log("updating euroValue");
        console.log(jsonObj);
        if(jsonObj["Realtime Currency Exchange Rate"] !== undefined){
            euroValue = jsonObj["Realtime Currency Exchange Rate"]["5. Exchange Rate"];
        }else{
            console.log("failed to fetch eurovalue");
        }
        this.forceUpdate();
    }

    updateUnitValues(){
        let jsPortfolios = this.state.jsPortfolios;
        let nameList = [];
        //For each portfolio
        Object.keys(jsPortfolios).forEach(function(pkey){
            let jsPortfolio = jsPortfolios[pkey].jsStocks;
            //For each stock
            Object.keys(jsPortfolio).forEach(function(skey){
                let stock = jsPortfolio[skey];
                let name = stock.name;
                //If stock not in list of stocknames
               if(nameList.indexOf(name) < 0){
                   //Add stock to list
                   nameList.push(name);
               }
            });

        });
        //For each stockname in list
        nameList.forEach(function(name){
            //Fetch current unit value with updateUnitValue as callback function.
            getStockData(this.updateUnitValue.bind(this), name, null);
        }.bind(this));
    }
    /**
     * Callback function for updateUnitValues.
     */
    updateUnitValue(jsonObj){
        console.log("Update unit value!");
        console.log(jsonObj);
        if(jsonObj['Meta Data'] === undefined){
            console.log("updateUnitValue received undefined stuff");
            return;
        } //Just fuck it and let it try later if this is undefined.
        let name = Object.values(jsonObj['Meta Data'])[1];              //The symbol
        let firstVal = Object.values(jsonObj['Time Series (1min)'])[0]; //First row of the time series
        let latestClose = firstVal['4. close'];                         //The close value of the first row (most recent)

        let state = this.state;
        let jsPortfolios = state.jsPortfolios;
        //For each portfolio
        Object.keys(jsPortfolios).forEach(function(pkey){
            let portfolio = jsPortfolios[pkey];
            console.log("Total value before: " + portfolio.total_value);
            let total_value = 0;
            //For each stock
            Object.keys(portfolio).forEach(function(skey){
                let stock = portfolio[skey];
                //If stock name is equal to jsonObj.name
                if(stock.name === name){
                    //Change stock's unit value to the new value
                    stock.unit_value = latestClose;
                    //Set portfolio[skey] to the new version
                    portfolio[skey] = stock;
                }
                //Increment portfolios total value
                total_value += stock.unit_value*stock.quantity;

            });
            //Remove extra decimals
            total_value = total_value.toFixed(2);
            console.log("Total value after: " + portfolio.total_value);
            //Set jsPortfolios[pkey] to the new version
            jsPortfolios[pkey] = portfolio;
        });
        state.jsPortfolios = jsPortfolios;
        //update state and local storage
        this.setState(state);
        this.updateLocalStorage();
    }
    componentDidMount(){
        //update values
        this.updateUnitValues();
        getEuroValue(this.updateEuroValue.bind(this));

        console.log("App did mount");
        let portfolios = [];
        let jsPortfolios = {};
        if(storageAvailable("localStorage")){
            //Check if there are any juicy localstorage portfolios
            if(localStorage.jsPortfolios !== undefined){
                console.log("Found existing list in local storage");
                console.log(localStorage.jsPortfolios);
                jsPortfolios = JSON.parse(localStorage.jsPortfolios);
                if(localStorage.euroValue !== undefined){
                    euroValue = JSON.parse(localStorage.euroValue);
                }
                Object.keys(jsPortfolios).forEach(function(key){
                    console.log("portofolio name: " + jsPortfolios[key].name);
                    let portfolio = <Portfolio key={(jsPortfolios[key].id)}
                                               id={jsPortfolios[key].id}
                                               name={(jsPortfolios[key].name)}
                                               setGraph={this.setGraph.bind(this)}
                                               deletePortfolio={this.deletePortfolio.bind(this)}
                                               updatePortfolio={this.updatePortfolio.bind(this)}
                                               setPrompt={this.setPrompt.bind(this)}
                                               currency={jsPortfolios[key].currency}
                                               jsStocks={jsPortfolios[key].jsStocks}/>;
                    portfolios.push(portfolio);
                }.bind(this));
                console.log("Found existing list in local storage");
                console.log(jsPortfolios);
            }else{
                //If there is no "portfolios" in local storage, put the empty list there
                localStorage.portfolios = portfolios;
                console.log("Putting empty list in local storage");
                console.log(localStorage.portfolios);
            }
        }else{
            alert("Yo browsa so old, she don't even support local storage.");
        }
        let state = this.state;
        state.portfolios = portfolios;
        state.jsPortfolios = jsPortfolios;
        this.setState(state);


        this.loaded = true;
    }
    updateLocalStorage(){
        if(this.loaded){
            //This will probably be useless after Reactyfying
            let jsPortfolios = this.state.jsPortfolios;
            if(debugAll){
                console.log("Saving to local storage");
                console.log(jsPortfolios);
            }
            localStorage.euroValue = JSON.stringify(euroValue);
            localStorage.jsPortfolios = JSON.stringify(jsPortfolios);
        }
    }

    deletePortfolio(key){
        //Delete the portfolio whose [X] button was just clicked.
        console.log("Before deleting");
        let state = this.state;
        let jsPortfolios = this.state.jsPortfolios;
        console.log(jsPortfolios);
        delete jsPortfolios[key];

        let portfolios = this.state.portfolios;
        portfolios.forEach(function(portfolio){
           if(key === portfolio.key){
               console.log("Deleting portfolio:",key);
               portfolios.splice(portfolios.indexOf(portfolio), 1);
           }
        });
        console.log("After deleting");
        console.log(jsPortfolios);
        state.jsPortfolios = jsPortfolios;
        state.portfolios = portfolios;
        this.setState(state);
        this.updateLocalStorage();
    }

    updatePortfolio(portfolio){
        //Update this portfolio
        if(debugAll){
            console.log("Update portfolio");
            console.log(portfolio);
            console.log(portfolio.id);
        }
        let state = this.state;
        state.jsPortfolios[portfolio.id] = portfolio;
        this.setState(state);
        this.updateLocalStorage();
    }

    addPortfolio(){
        if(Object.keys(this.state.jsPortfolios).length >= 10){
            alert("You can only have 10 portfolios");
            return;
        }
        var name = prompt("Pick a name for the portfolio.");
        if(name === null || name.trim() === ""){
            alert("The name cannot be empty.");
        }else{
            //Get current list of portfolios, push this new portfolio to it and update the state and local storage.
            let portfolios = this.state.portfolios;
            let jsPortfolios = this.state.jsPortfolios;
            if(jsPortfolios === undefined){
                jsPortfolios = {};
            }
            let state = this.state;
            let id = guid();
            let stocks = {};
            portfolios.push(<Portfolio key={id}
                                       id={id}
                                       name={name}
                                       setGraphApp={this.setGraph.bind(this)}
                                       updatePortfolio={this.updatePortfolio.bind(this)}
                                       deletePortfolio={this.deletePortfolio.bind(this)}
                                       setPrompt={this.setPrompt.bind(this)}
            />);
            state.portfolios = portfolios;
            jsPortfolios[id] = {
                key: id,
                id: id,
                name: name,
                currency: "euro",
                stocks: stocks
            };
            this.setState(state);
            this.updateLocalStorage();
        }
    }
    setPrompt(prompt){
        let state = this.state;
        state.prompt = prompt;
        this.setState(state);
    }
    setGraph(data){
        console.log("setGraph");
        let name = data[0];
        let jsStocks = data[1];
        let intervalInfo = data[2];
        let state = this.state;
        state.intervalStart = intervalInfo[0];
        state.intervalEnd = intervalInfo[1];
        state.cancelGraph = false;
        state.graphName = name;
        state.graphLines = [];
        let stockNames = [];

        //todo currently adds same symbol multiple times.
        //Grab names of the stocks
        Object.keys(jsStocks).forEach(function(key){
            let name = jsStocks[key].name;
            if(stockNames.indexOf(name) < 0) { //If not in list add it
                stockNames.push(name);
            }
            if(debugAll || debugGraph || true) console.log("Stock symbol: ",name);
        });
        state.graphLinesTotal = stockNames.length;
        state.graphLinesCount = 0;
        this.setState(state);
        let intervalSize = daysDifference(state.intervalStart, state.intervalEnd);
        //For each stock name get the data
        stockNames.forEach(function(name){
            let url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol="+name+"&outputsize=compact&apikey=" + API_KEY;
            state.intervalType = "day";
            this.setState(state);
            if(intervalSize > 80) { //There are weekends and holidays and stuff so it can't be 100 (80 is just a guess).
                url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol="+name+"&outputsize=full&apikey=" + API_KEY;
            }else if(intervalSize === 0){
                state.intervalType = "intraday";
                this.setState(state);
                //intraday 15 min interval; compact because there's only 96 15min intervals in a day.
                url = "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol="+name+"&interval=15min&outputsize=compact&apikey=" + API_KEY;
            }
            xhttpRequest(this.addGraphData.bind(this), url, null);
        }.bind(this));
        state.graph = <div>
                          <Button function={this.closeGraph.bind(this)} className="CloseGraphButton" label="X"/>
                          <Loader/>
                      </div>;
        disableButtons = true;
        this.setState(state);
    }
    addGraphData(jsonObj){
        //If the client hasn't pressed the X to cancel the graph, then do the following.
        if(!this.state.cancelGraph){
            let state = this.state;
            console.log("Adding graph data");
            if(debugAll || debugGraph) {
                console.log("Raw:");
                console.log(jsonObj);
            }
            if(jsonObj["Meta Data"] === undefined){
                alert("Failed to fetch graph data, the API is likely under heavy use at the moment. Please try again.");
                state.graph = undefined;
                this.setState(state);
                return;
            }
            let symbol = jsonObj["Meta Data"]["2. Symbol"];
            let timeSeries = null;
            if(state.intervalType === "day"){
                timeSeries = jsonObj["Time Series (Daily)"];
            }else{
                timeSeries = jsonObj["Time Series (15min)"];
            }

            let color = getRandomColor();
            let points = [];
            state.graphLinesCount = state.graphLinesCount + 1;
            console.log("Time series:");
            console.log(timeSeries);


            console.log("Before loop endDate: " + state.intervalEnd);
            //For each value in the time series, get the date and the closing value and make a JSON point of it.
            //Then add that point to the list of points.
            let counter = 1;
            Object.keys(timeSeries).forEach(function(key){
                let date = key;
                let startDiff = daysDifference(date, state.intervalStart);
                let endDiff = daysDifference(state.intervalEnd, date);

                //Check if it's within the interval
                if(state.intervalType === "day"){
                    if(startDiff > 0 || endDiff > 0){
                        //Not adding
                    }else{
                        let close = timeSeries[key]["4. close"];
                        let jsPoint = {x: date, y: parseFloat(close)};
                        points.push(jsPoint);
                        if(debugAll || debugGraph) console.log(symbol, "close:", close);
                    }
                }else{
                    //Intraday stuff has to be same day but since we fetch more 15 min intervals than fit in a day
                    // there will also be other days included so we better remove those.
                    let close = timeSeries[key]["4. close"];
                    let jsPoint = {x: counter, y: parseFloat(close)};
                    points.push(jsPoint);
                    counter++;
                    if(debugAll || debugGraph) console.log(symbol, "close:", close);
                }

            });
            points.reverse();
            //Push this line to the list of graph lines in state.
            state.graphLines.push({
                name: symbol.toUpperCase(),
                color: color,
                points: points
            });
            console.log("state.graphLines:",      state.graphLines);
            console.log("state.graphLinesCount:", state.graphLinesCount);
            console.log("state.graphLinesTotal:", state.graphLinesTotal);

            //Only create the graph when the final value has arrived.
            if(state.graphLinesCount === state.graphLinesTotal){
                console.log("Changing state.graph!");
                //state.graph = <GraphWindow intervalChanged={this.intervalChanged.bind(this)} startDate={this.state.intervalStart} endDate={this.state.intervalEnd} intervalType={this.state.intervalType} name={state.graphName} data={state.graphLines} renderNow={this.renderNow.bind(this)} closeGraph={this.closeGraph.bind(this)}/>;

                state.graph = <GraphWindow
                                startDate={this.state.intervalStart}
                                endDate={this.state.intervalEnd}
                                intervalType={this.state.intervalType}
                                name={state.graphName}
                                data={state.graphLines}
                                renderNow={this.renderNow.bind(this)}
                                closeGraph={this.closeGraph.bind(this)}/>;
            }
            this.setState(state);
        }
    }
    /**
     *
     * @param info: [startDate, endDate] as strings
     */
    /*
    intervalChanged(info){
        console.log("intervalChanged received: ", info);

        //Comment from here
        //set new interval in state
        let state = this.state;
        state.startDate = info[0];
        state.endDate   = info[1];
        state.graphLinesCount = 0;
        state.graphLinesTotal = this.graphDataStorage.length;
        state.graph = <div>
                        <Button function={this.closeGraph.bind(this)} className="CloseGraphButton" label="X"/>
                        <Loader/>
                    </div>;
        this.setState(state);
        //Loop through graphDataStorage and send each of the JSON objects to addGraphData;
        this.graphDataStorage.forEach(function(graphData){
            console.log("Sending the following to addGraphData: ", graphData);
            this.addGraphData(graphData, 1);
        }.bind(this));
        //Comment to here

        //Calculate new data with this interval
        let graphLines = [];
        let intervalStart = info[0];
        let intervalEnd = info[1];
        let intervalType = "day";
        if(daysDifference(intervalStart, intervalEnd) === 0){
            intervalType = "intraday";
        }

        this.graphDataStorage.forEach(function(jsonObj){
            let symbol = jsonObj["Meta Data"]["2. Symbol"];
            let timeSeries = null;
            if(this.state.intervalType === "day"){
                timeSeries = jsonObj["Time Series (Daily)"];
            }else{
                timeSeries = jsonObj["Time Series (15min)"];
            }

            let color = getRandomColor();
            let points = [];
            console.log("Time series:");
            console.log(timeSeries);


            console.log("Before loop endDate: " + intervalEnd);
            //For each value in the time series, get the date and the closing value and make a JSON point of it.
            //Then add that point to the list of points.
            let counter = 1;
            Object.keys(timeSeries).forEach(function(key){
                let date = key;
                let startDiff = daysDifference(date, intervalStart);
                let endDiff = daysDifference(intervalEnd, date);

                //Check if it's within the interval
                if(intervalType === "day"){
                    if(startDiff > 0 || endDiff > 0){
                        //Not adding
                    }else{
                        let close = timeSeries[key]["4. close"];
                        let jsPoint = {x: date, y: parseFloat(close)};
                        points.push(jsPoint);
                        if(debugAll || debugGraph) console.log(symbol, "close:", close);
                    }
                }else{
                    //Intraday stuff has to be same day but since we fetch more 15 min intervals than fit in a day
                    // there will also be other days included so we better remove those.
                    let close = timeSeries[key]["4. close"];
                    let jsPoint = {x: counter, y: parseFloat(close)};
                    points.push(jsPoint);
                    counter++;
                    if(debugAll || debugGraph) console.log(symbol, "close:", close);
                }

            });
            points.reverse();
            //Push this line to the list of graph lines in state.
            graphLines.push({
                name: symbol.toUpperCase(),
                color: color,
                points: points
            });
        }.bind(this));
        return graphLines;
    }
    */
    closeGraph(){
        let state = this.state;
        state.graph = undefined;
        state.cancelGraph = true;
        disableButtons = false;
        this.setState(state);
    }

    renderNow(){
        console.log("Re-render app");
        this.forceUpdate();
    }

    render() {
        if(this.state.graph === undefined){
            if(this.state.prompt !== undefined){
                //There's a prompt
                console.log("Drawing app with prompt");
                return (
                    <div className="App">
                        <div className="BlurLayer">
                            <div className="Header">
                                <div className={"Header-title"}>
                                    <span>Stock portfolio Manager</span>
                                </div>
                                <Button function={this.addPortfolio.bind(this)}
                                        className="AddPortfolioButton" label="Add portfolio"/>
                            </div>
                            <div className={"Spacer"}/>
                            <div className="Portfolio_container col-11 col-m-11 clearfix">
                                {this.state.portfolios}
                            </div>
                        </div>
                        <div>
                            {this.state.prompt}
                        </div>
                    </div>
                );
            }else{
                //There is no prompt and no graph
                console.log("Drawing app with no graph");
                return (
                    <div className="App">
                        <div className="Header">
                            <div className={"Header-title"}>
                                <span>Stock portfolio Manager</span>
                            </div>
                            <Button function={this.addPortfolio.bind(this)}
                                    className="AddPortfolioButton" label="Add portfolio"/>
                        </div>
                        <div className={"Spacer"}/>
                        <div className="Portfolio_container col-11 col-m-11 clearfix">
                            {this.state.portfolios}
                        </div>
                    </div>
                );
            }
        }else{
            //There is a graph.
            console.log("Drawing app with graph");
            return (
                <div className="App">
                    <div className="BlurLayer">
                        <div className="Header">
                            <div className={"Header-title"}>
                                <span>Stock portfolio Manager</span>
                            </div>
                            <Button function={this.addPortfolio.bind(this)}
                                    className="AddPortfolioButton" label="Add portfolio"/>
                        </div>
                        <div className={"Spacer"}/>
                        <div className="Portfolio_container col-11 col-m-11 clearfix">
                            {this.state.portfolios}
                        </div>
                    </div>
                    <div className="GraphContainer">
                        {this.state.graph}
                    </div>
                </div>
            );
        }

    }
}
class Portfolio extends Component {
    updatePortfolio = undefined;
    deleteThis      = undefined;
    setGraph        = undefined;
    loaded          = false;
    constructor(props){
        super(props);
        this.deleteThis      = this.props.deletePortfolio;
        this.updatePortfolio = this.props.updatePortfolio;
        this.setGraph     = this.props.setGraph;
        this.state = {
            name:        this.props.name,
            currency:    currency,
            id:          this.props.id,
            originaljsStocksOrder: this.props.jsStocks,
            jsStocks:    this.props.jsStocks,
            total_value: 0.0,
            selected:    [],
            sortDirections: {
                symbol: "none",
                unit_value: "none",
                quantity: "none",
                total_value: "none"
            }
        };
        this.loaded = true;
    }

    componentDidMount(){
        //Don't try to setState() before component is properly mounted.
        if(this.state.jsStocks !== undefined){
            this.updateToShow();
        }
    }

    stockSpaceAvailable(symbol){
        if(this.state.jsStocks === undefined || Object.keys(this.state.jsStocks).length < MAX_STOCKS){
            let state = this.state;
            state.jsStocks = {};
            this.setState(state);
            return true;
        }
        else{
            let names = [];
            Object.keys(this.state.jsStocks).forEach(function(key){
                let name = this.state.jsStocks[key].name;
                if(names.indexOf(name) < 0) { //If not in list add it
                    names.push(name);
                }
            }.bind(this));
            if(names.length < MAX_STOCKS){
                console.log("2 OK because MAX_STOCKS: ", MAX_STOCKS);
                console.log("2 And length: ", Object.keys(this.state.jsStocks).length);
                return true;
            }
            if(names.length >= MAX_STOCKS && names.indexOf(symbol) >= 0){
                return true;
            }
            return false;
        }
    }
    addStock(){
        //This function takes the input and tries to fetch the data of that stock symbol.
        let input = prompt("Enter the stock's symbol and how many you have. e.g. \"MSFT, 10\"");
        let symbol = "";
        let quantity = 0;
        if(input === null || input.trim() === ""){
            //alert("The symbol cannot be empty.");
            input = ("MSFT, 13").split(",");
            symbol = input[0].trim();
            quantity = input[1].trim();
        }else {
            let splitInput = input.split(",");
            if(splitInput[0].trim() === input.trim()){
                symbol = splitInput.trim();
                quantity = 1;
            }else{
                symbol = splitInput[0].trim();
                quantity = splitInput[1].trim();
            }
        }
        try{
            parseFloat(quantity);
            getStockData(this.addStock2.bind(this), symbol, quantity);
        }catch(e){
            alert("That's not a valid input");
        }


    }
    addStock2(jsonObj, quantity){
        //The callback function of the XHTTPrequest.
        //This is where the stock is actually created.
        console.log("Got the data!");
        if(Object.keys(jsonObj)[0] === "Error Message"){
            alert("Could not find a stock with that symbol. Double check and try again.");
        }else{
            let state = this.state;
            let name = Object.values(jsonObj['Meta Data'])[1]; //The symbol
            if(!this.stockSpaceAvailable(name)){
                alert("Can not do that! You can only have 50 stocks of different symbols.");
                return;
            }
            let firstVal = Object.values(jsonObj['Time Series (1min)'])[0]; //First row of the time series
            let latestClose = firstVal['4. close']; //The close value of the first row (most recent)
            let oldValue = state.total_value;
            let id = guid();
            state.total_value = (parseFloat(oldValue) + parseFloat(latestClose)*parseFloat(quantity)).toFixed(2);

            //Reacty part. The <Stock /> still needs to be created but only when showing.
            let jsStocks = state.jsStocks;
            if(jsStocks === undefined) {
                jsStocks = {};
                jsStocks[id] = {
                    id: id,
                    name: name,
                    unit_value: latestClose,
                    quantity: quantity
                };
                state.jsStocks = jsStocks;
            }else{
                jsStocks[id] = {
                    id: id,
                    name: name,
                    unit_value: latestClose,
                    quantity: quantity
                };
                state.jsStocks = jsStocks;
            }
            this.setState(state);
            //Since we now changed this Portfolio we need to pass the information up!
            //that is done in the end of updateToShow
            this.updateToShow();
        }
    }
    perfGraph(){
        console.log("Show performance graph!");
        this.props.setPrompt(<IntervalPrompt callBack={this.intervalPromptCallback.bind(this)}/>);
    }
    intervalPromptCallback(info){
        if(info === "close"){
            this.props.setPrompt(undefined);
        }else{
            this.props.setPrompt(undefined);
            let state = this.state;
            //Send intervals with the other info in setGraph. Then in setGraph(actually in addGraph),
            //remove all objects outside of interval
            this.setGraph([this.state.name, state.jsStocks, info]);
        }
    }


    deletePortfolio(){
        let input = window.confirm("Are you sure you want to delete this portfolio?");
        if(input){
            console.log("Deleting");
            console.log(this.state.id);
            this.deleteThis(this.state.id);
        }
    }
    showEuro(){
        this.updateCurrency("euro");
    }
    showDollar(){
        this.updateCurrency("dollar");
    }
    updateCurrency(currency){
        let state = this.state;
        state.currency = currency;
        this.setState(state);
        this.updateToShow();
    }
    updateStocks(stocks, newTotalValue){
        let state = this.state;
        state.jsStocks = stocks;
        state.total_value = newTotalValue;

        this.setState(state);
        this.updateToShow();
    }

    /**
     * Callback function for when stocks have been mounted to
     * let the portfolio it's time to re-render
     */
    renderNow(){
        if(debugAll)console.log("Render now!");
        this.forceUpdate();
    }
    updateToShow(){
        let state = this.state;
        let jsStocks = this.state.jsStocks;
        let showStocks = [];
        let getcurr = this.getCurrency.bind(this);
        let updateSelected = this.setSelected.bind(this);
        let multiplier = 0;
        let totalValue = 0;

        //Figure out which multiplier to use (euroValue for euro or 1 for dollar).
        if(jsStocks !== undefined){
            totalValue = this.getTotalValue(jsStocks);
            if(this.state.currency === "euro"){
                multiplier = euroValue;
                console.log("Setting multiplier = euroValue");
            }else{
                multiplier = 1;
                console.log("Setting multiplier = 1");
            }
        }
        totalValue = (totalValue * multiplier).toFixed(2);


        console.log("in showstocks loop-------------------------");
        //For each stock in jsStocks create a <Stock/> to push to the showStocks list
        Object.keys(jsStocks).forEach(function(key){
            let stock = jsStocks[key];
            let unit_value = (parseFloat(stock.unit_value)*multiplier).toFixed(2);
            let id = stock.id;
            if(debugAll || debugAppRender){
                console.log("Unit_value:", unit_value);
            }
            let newStock = <Stock
                updateSelected={updateSelected}
                getcurrency={getcurr}
                key={id}
                id={id}
                name={stock.name.toUpperCase()}
                unit_value={unit_value}
                quantity={stock.quantity}
                renderNow={this.renderNow.bind(this)}
                />;
            showStocks.push(newStock);
        }.bind(this));
        console.log("-------------------------------------------");
        if(debugAppRender){
            console.log("Total value:", totalValue);
            console.log("showStocks:",showStocks);
        }

        //Update state, forcing rerender
        state.showStocks = showStocks;
        state.total_value = totalValue;
        this.setState(state);

        console.log("This is the state after updating showStocks: ", this.state);

        //Since this is the last stop for all modifying functions in this class we pass the change up at this point.
        this.passItUp();
    }


    /**
     * Call this whenever a change occurs to pass that info up so the big boss is aware of it.
     */
    passItUp(){
        let state = this.state;
        let save = {
            name: state.name,
            id: state.id,
            currency: state.currency,
            jsStocks: state.jsStocks,
            total_value: state.total_value,
        };
        if(debugAll)console.log("Saving state!", save);
        this.updatePortfolio(save);
    }
    getCurrency(){
        console.log("getCurrency");
        return this.state.currency;
    }
    getTotalValue(jsStocks){
        if(debugAll)console.log("Getting total value:",jsStocks);
        let totalValue = 0;
        Object.keys(jsStocks).forEach(function(key){
            let current = jsStocks[key];
            totalValue += parseFloat(current.quantity)*parseFloat(current.unit_value);
        });
        return totalValue;
    }
    //Changes list of selected stocks.
    setSelected(key, bool){
        console.log("Change in selected!");
        let state = this.state;
        let selected = this.state.selected;
        if(bool){
            //The stock with this key is now selected
            //Add it to the list
            selected.push(key);
            state.selected = selected;
            this.setState(state);
        }else{
            //The stock with this key is now unselected
            //Remove it from the list
            let index = selected.indexOf(key);
            selected.splice(index, 1);
            state.selected = selected;
            this.setState(state);
        }
        console.log("Selected: ", this.state.selected);
    }
    //Removes all stocks that are in the list of selected stocks
    removeSelected(){
        console.log("Removing stock!");
        let jsStocks = this.state.jsStocks;
        let selected = this.state.selected;
        let i = selected.length;
        while(i--){
            Object.keys(jsStocks).forEach(function(key){
                if(selected[i] === key){
                    delete jsStocks[key];
                    selected.splice(selected.indexOf(key), 1);
                }
            });
        }
        this.updateStocks(jsStocks, this.getTotalValue(jsStocks));
    }
    sortStocks(label, direction){
        let state = this.state;
        let jsStocks = state.jsStocks;
        let sorted = {};

        //Sort ascending
        if(direction === "asc"){
            //While length of sorted is less than that of jsStocks
            while(Object.keys(sorted).length < Object.keys(jsStocks).length){
                //For each stock in jsStocks
                Object.keys(jsStocks).forEach(function(key){
                    let stock = jsStocks[key];
                    Object.keys(sorted).forEach(function(sortedStock){
                        console.log("if "+ stock[label]+ " >= " + sortedStock[label]);
                        if(stock[label] >= sortedStock[label]){
                            console.log("Do the thing!");
                            sorted[sorted.indexOf(sortedStock) +1] = stock;
                        }
                    });
                });
            }
        //Sort descending
        }else if(direction === "desc"){
            //While length of sorted is less than that of jsStocks
            while(Object.keys(sorted).length < Object.keys(jsStocks).length) {
                //For each stock in jsStocks
                Object.keys(jsStocks).forEach(function (key) {
                    let stock = jsStocks[key];
                    Object.keys(sorted).forEach(function(sortedStock){
                        console.log("if "+ stock[label]+ " >= " + sortedStock[label]);
                        if(stock[label] < sortedStock[label]){
                            sorted[sorted.indexOf(sortedStock) +1] = stock;
                        }
                    });
                });
            }
        }
        state.jsStocks = sorted;
        this.setState(sorted);
    }
    alertSort(label, direction){
        if(sortWorking){
            //Set all directions to "none" and set this one to {direction}
            let state = this.state;
            state.sortDirections.symbol = "none";
            state.sortDirections.unit_value = "none";
            state.sortDirections.quantity = "none";
            state.sortDirections.total_value = "none";
            state.sortDirections[label] = direction;
            this.setState(state);
            if(direction !== "none"){
                this.sortStocks(label, direction);
            }
        }
    }
    render() {
        let currencySymbol = dollarSymbol;
        if(this.state.currency === "euro"){
            currencySymbol = euroSymbol;
        }
        if(debugAll || debugAppRender){
            console.log("Rendering this showStocks: ");
            console.log(this.state.showStocks);
        }
        if(debugSorting){
            console.log("Sort directions:", this.state.sortDirections);
        }
        console.log("------------------------------------");
        return (
            <div className="Portfolio col- col-5 col-m-11">
                <div className="Portfolio-inner">
                    <div className="Portfolio-header">
                        <span   className="Portfolio-title col- col-5 col-m-11">{this.props.name}</span>
                        <Button function={this.showDollar.bind(this)}      className="Portfolio-header-showEuro"     label="Show in $"/>
                        <Button function={this.showEuro.bind(this)}        className="Portfolio-header-showDollar"   label="Show in €"/>
                        <Button function={this.deletePortfolio.bind(this)} className="Portfolio-header-deleteButton" label="X"/>
                        <br/>
                    </div>
                    <div className="Portfolio-content">
                        <table>
                            <thead>
                            <tr>
                                <th><div className="Table-label">
                                    <SortButton
                                        label={"Symbol"}
                                        value={"symbol"}
                                        alertSorted={this.alertSort.bind(this)}
                                        direction={this.state.sortDirections.symbol}
                                    />
                                </div></th>
                                <th><div className="Table-label">
                                    <SortButton
                                        label={"Unit value"}
                                        value={"unit_value"}
                                        alertSorted={this.alertSort.bind(this)}
                                        direction={this.state.sortDirections.unit_value}
                                    />
                                </div></th>
                                <th><div className="Table-label">
                                    <SortButton
                                        label={"Quantity"}
                                        value={"quantity"}
                                        alertSorted={this.alertSort.bind(this)}
                                        direction={this.state.sortDirections.quantity}
                                    />
                                </div></th>
                                <th><div className="Table-label">
                                    <SortButton
                                        label={"Total value"}
                                        value={"total_value"}
                                        alertSorted={this.alertSort.bind(this)}
                                        direction={this.state.sortDirections.total_value}
                                    />
                                </div></th>
                                <th><div className="Table-label">
                                    Select
                                </div></th>
                            </tr>
                            </thead>
                            <tbody>
                                {this.state.showStocks}
                            </tbody>
                        </table>
                    </div>
                    <div className="Portfolio-footer">
                        <p>
                            Total value: <label className="totalPortfolioValue">{this.state.total_value}{currencySymbol}</label>
                        </p>
                        <Button function={this.addStock.bind(this)} className="Portfolio-footer-addStockButton" label="Add stock"/>
                        <Button function={this.perfGraph.bind(this)} className="Portfolio-footer-perfGraphButton" label="Performance graph"/>
                        <Button function={this.removeSelected.bind(this)} className="Portfolio-footer-removeStockButton" label="Remove selected"/>
                    </div>
                </div>
            </div>
        );
    }
}

class Stock extends Component{
    renderNow = undefined;
    constructor(props){
        super(props);
        this.renderNow = this.props.renderNow;
        this.state = {
            id: this.props.id,
            updateSelected: this.props.updateSelected,
            getcurrency: this.props.getcurrency,
            name: this.props.name.toUpperCase(),
            unit_value: this.props.unit_value,
            quantity: this.props.quantity,
            total_value: (parseFloat(this.props.unit_value)*parseFloat(this.props.quantity)).toFixed(2),
            selected: false
        };
    }

    componentDidMount(){
        if(debugAll)console.log("Stock component did mount!");
        this.renderNow();
    }
    onChange(e){
        console.log("onChosen!");
        console.log(e.target.value);
        let state = this.state;
        state.selected = e.target.checked;
        this.setState(state);
        console.log("Sending key: " + this.state.id + " and boolean: " + !this.state.selected + " to updateSelected in portfolio!");

        this.state.updateSelected(this.state.id, this.state.selected);
    }
    render(){
        //Draw each table row
        if(debugAll) {
            console.log("This is in render in stock");
        }
        if(debugAppRender){
            console.log("Drawing stock with unit_value: " + this.state.unit_value);
        }
        return(
            <tr>
                <td><div className="after">{this.state.name.toUpperCase()}</div></td>
                <td><div className="after">{this.state.unit_value}</div></td>
                <td><div className="after">{this.state.quantity}</div></td>
                <td><div className="after">{this.state.total_value}</div></td>
                <td><div className="after"><input type='checkbox' onChange={this.onChange.bind(this)} checked={this.state.selected} value={this.key}/></div></td>
            </tr>
        );
    }
}

class GraphWindow extends Component{
    constructor(props){
        super(props);
        this.renderNow = this.props.renderNow;
        this.closeGraphCallback = this.props.closeGraph;
        //todo Determine what xDisplay function to use and add it to state.

        this.state = {
            name: this.props.name,
            data: this.props.data,
            startDate: moment(this.props.startDate),
            endDate: moment(this.props.endDate),
            interval: this.props.startDate + " - " + this.props.endDate,
            intervalType: this.props.intervalType,
        };
    }
    componentDidMount(){
        console.log("New GraphWindow mounted!");
        this.props.renderNow();
    }
    closeGraph(){
        this.closeGraphCallback();
    }
    handleStartChange(date) {
        console.log("Changed start date to: ", date.format("YYYY-MM-DD"));
        let state = this.state;
        if(date>state.endDate){
            alert("Start date can not be after end date");
            this.forceUpdate();
        }else{
            state.startDate = date;
            this.setState(state);
            let data = this.props.intervalChanged([date.format("YYYY-MM-DD"), this.state.endDate.format("YYYY-MM-DD")]);
            console.log("In Graphwindow received the following from App: ", data);
            state.data = data;
            this.setState(state);
        }
    }
    handleEndChange(date) {
        console.log("Changed end date to: ", date.format("YYYY-MM-DD"));
        let state = this.state;
        if(date<state.startDate){
            alert("End date can not be before start date");
            this.forceUpdate();
        }else{
            state.endDate = date;
            this.setState(state);
            let data = this.props.intervalChanged([this.state.startDate.format("YYYY-MM-DD"), date.format("YYYY-MM-DD")]);
            console.log("In Graphwindow received the following from App: ", data);
            state.data = data;
            this.setState(state);
        }
    }
    render(){
        console.log("rendering graphwindow with the following data:",this.state.data);
        if(graphDatePickerWorks){
            if(this.props.intervalType === "day"){
                console.log("daily");
                return (
                    <div>
                        <div className="GraphWindowHeader">
                            <Button function={this.closeGraph.bind(this)} className="CloseGraphButton" label="X"/>
                        </div>
                        <h1>{this.state.name}</h1>
                        <h3>Performance graph ({this.state.interval})</h3>
                        <h3>{"Daily"}</h3>
                        <div className="GraphWindow">
                            <LineChart
                                width={800}
                                height={400}
                                xLabel={"Time"}
                                yLabel={"Closing value (USD)"}
                                data={this.state.data}
                                hidePoints={true}
                                pointRadius={0.5}
                                showLegends={true}
                                isDate={true}
                                xDisplay={getDate}
                            />
                        </div>
                        <div className="PerfGraphDatePicker">
                            <span>Start date</span>
                            <DatePicker
                                selected={this.state.startDate}
                                onChange={this.handleStartChange.bind(this)}
                            />
                            <span>End date</span>
                            <DatePicker
                                selected={this.state.endDate}
                                onChange={this.handleEndChange.bind(this)}
                            />
                        </div>
                    </div>
                );
            }else{
                console.log("intraday");
                return (
                    <div>
                        <div className="GraphWindowHeader">
                            <Button function={this.closeGraph.bind(this)} className="CloseGraphButton" label="X"/>
                        </div>
                        <h1>{this.state.name}</h1>
                        <h3>Performance graph ({this.state.interval})</h3>
                        <h3>{"Intraday"}</h3>
                        <div className="GraphWindow">
                            <LineChart
                                width={800}
                                height={400}
                                xLabel={"Point"}
                                yLabel={"Closing value (USD)"}
                                data={this.state.data}
                                hidePoints={true}
                                pointRadius={0.5}
                                showLegends={true}
                                isDate={false}
                                xDisplay={null}
                            />
                        </div>
                        <div className="PerfGraphDatePicker">
                            <span>Start date</span>
                            <DatePicker
                                selected={moment(this.state.startDate)}
                                onChange={this.handleStartChange.bind(this)}
                            />
                            <span>End date</span>
                            <DatePicker
                                selected={moment(this.state.endDate)}
                                onChange={this.handleEndChange.bind(this)}
                            />
                        </div>
                    </div>
                );
            }
        }else{
            if(this.props.intervalType === "day"){
                console.log("daily");
                return (
                    <div>
                        <div className="GraphWindowHeader">
                            <Button function={this.closeGraph.bind(this)} className="CloseGraphButton" label="X"/>
                        </div>
                        <h1>{this.state.name}</h1>
                        <h3>Performance graph ({this.state.interval})</h3>
                        <h3>{"Daily"}</h3>
                        <div className="GraphWindow">
                            <LineChart
                                width={800}
                                height={400}
                                xLabel={"Time"}
                                yLabel={"Closing value (USD)"}
                                data={this.state.data}
                                hidePoints={true}
                                pointRadius={0.5}
                                showLegends={true}
                                isDate={true}
                                xDisplay={getDate}
                            />
                        </div>
                    </div>
                );
            }else{
                console.log("intraday");
                return (
                    <div>
                        <div className="GraphWindowHeader">
                            <Button function={this.closeGraph.bind(this)} className="CloseGraphButton" label="X"/>
                        </div>
                        <h1>{this.state.name}</h1>
                        <h3>Performance graph ({this.state.interval})</h3>
                        <h3>{"Intraday"}</h3>
                        <div className="GraphWindow">
                            <LineChart
                                width={800}
                                height={400}
                                xLabel={"Point"}
                                yLabel={"Closing value (USD)"}
                                data={this.state.data}
                                hidePoints={true}
                                pointRadius={0.5}
                                showLegends={true}
                                isDate={false}
                                xDisplay={null}
                            />
                        </div>
                    </div>
                );
            }
        }



    }
}
function getYear(info){
    return (info.getMonth()+1)+"/"+info.getFullYear();
}
function getDate(info){
    console.log("Month: " + info.getMonth());
    console.log("Day: "+ info.getDay());
    return parseInt(info.getDay())+1+"/"+(info.getMonth()+1);
}
function getRandomColor() {
    var letters = '23456789ABCD';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 12)];
    }
    return color;
}
/**
 * A custom button
 */
class Button extends Component {
    constructor(props){
        super(props);
        this.state = {
            function: props.function
        };
    }
    handleClick(e){
        if(!disableButtons || e.target.offsetParent.className === "GraphContainer"){
            this.state.function(e);
        }
    }
    render(){
        return (
            <button className="btn" key={guid()} value={this.props.value} onClick={this.handleClick.bind(this)}>
                {this.props.label}
            </button>
        );
    }
}

class IntervalPrompt extends Component {
    constructor(props){
        super(props);
        let today = moment();

        this.state = {
            startDate: today,
            endDate: today,
        };
    }
    callback(e){
        console.log("Pressed ok in prompt!");
        console.log(e);
        let startDate = this.state.startDate.format("YYYY-MM-DD");
        let endDate = this.state.endDate.format("YYYY-MM-DD");
        console.log("startDate: " + startDate + " endDate: " + endDate);
        this.props.callBack([startDate, endDate]);
    }
    handleStartChange(date) {
        let state = this.state;
        if(date>state.endDate){
            alert("Start date can not be after end date");
            this.forceUpdate();
        }else{
            state.startDate = date;
            this.setState(state);
        }
    }
    handleEndChange(date) {
        let state = this.state;
        if(date<state.endDate){
            alert("End date can not be before start date");
            this.forceUpdate();
        }else{
            state.endDate = date;
            this.setState(state);
        }
    }
    closePrompt(){
        console.log("closing prompt");
        this.props.callBack("close");
    }
    render(){
        return(
            <div className="IntervalPrompt">
                <Button className={"closePromptButton"} function={this.closePrompt.bind(this)} label={"X"}/>
                <div className="IntervalPrompt-inner">
                    <br/>
                    <br/>
                    <span>Pick start date</span>
                    <DatePicker
                        selected={this.state.startDate}
                        onChange={this.handleStartChange.bind(this)}
                    />
                    <br/>
                    <span>Pick end date</span>
                    <DatePicker
                        selected={this.state.endDate}
                        onChange={this.handleEndChange.bind(this)}
                    />
                    <br/>
                    <Button function={this.callback.bind(this)} value={"ok"} label={"Ok"}/>
                </div>
            </div>
        );

    }
}
class SortButton  extends Component {
    constructor(props){
        super(props);
        this.state = {
            sortDir: "none",
            sortDirArrow: ""
        }
    }
    clicked() {
        let sortDir = this.state.sortDir;
        if(sortDir === "none"){
            sortDir = "desc";
        }else if(sortDir === "desc"){
            sortDir = "asc";
        }else{
            sortDir = "none";
        }
        this.setSortDirArrow(sortDir);
    }
    setSortDirArrow(sortDir){
        let state = this.state;
        state.sortDir = sortDir;
        if(sortDir === "desc"){
            state.sortDirArrow = ' ↓';
        }else if(sortDir === "asc"){
            state.sortDirArrow = ' ↑';
        }else{
            state.sortDirArrow = '';
        }
        this.setState(state);
        this.props.alertSorted(this.props.value, this.state.sortDir);
    }

    render(){
        return(
            <div className={"SortButton"} onClick={this.clicked.bind(this)}>
                {this.props.label}{this.state.sortDirArrow}
            </div>
        )
    }
}

class Loader extends Component {
    render(){
        return(
            <div className={"loader"}/>
        )
    }
}

function daysDifference(start, end){
    let startDate = new Date(start);
    let endDate = new Date(end);
    var timeDiff = endDate.getTime() - startDate.getTime();
    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if(debugAll || debugDiffDays){
        console.log("In daysDifference");
        console.log("startDate:", startDate);
        console.log("endDate:", endDate);
        console.log("Days difference: " + diffDays);
    }
    return diffDays;
}


/**
 * Get stock data from alphavantage API
 * @param callback: the function to return the data to.
 * @param symbol: the symbol of the stock
 * @param quantity: the quantity of the stock. Needed in the callback function when adding stocks.
 */
function getStockData(callback, symbol, quantity){
    let url = "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol="+symbol+"&interval=1min&apikey="+API_KEY;
    console.log("Doing API request with url:" + url);
    xhttpRequest(callback, url, quantity);
}

/**
 *
 * @param callback
 * @param file
 * @param rememberThis: when needed (e.g. quantity of a stock)
 */
function xhttpRequest(callback, file, rememberThis){
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function (){
        if(this.readyState === 4 && this.status === 200){
            var jsonObj = JSON.parse(this.responseText);
            if(rememberThis !== null && rememberThis !== undefined && rememberThis !== 0){
                callback(jsonObj, rememberThis);
            }else{
                callback(jsonObj);
            }
        }
        if(this.status === 404){
            error(404, file);
        }
    }
    rawFile.send();
}

function error(status, file){
    alert("Could not get " + file + "\n 404, file not found.");
}

/**
 * Used to update update the euroValue variable.
 * Automatically called when page is loaded.
 * Can be used after that if needed as well.
 */
function getEuroValue(callback){
    let url = "https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=EUR&apikey="+API_KEY;
    xhttpRequest(callback, url, null);
}

//Generates unique ID
function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

//Check for localStorage
function storageAvailable(type) {
    try {
        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return e instanceof DOMException && (
                // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage.length !== 0;
    }
}
export default App;
