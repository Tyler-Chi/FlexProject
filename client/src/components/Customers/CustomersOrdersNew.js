/* eslint-disable no-undef */

import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import "./CustomersOrdersNew.css";
import CustomersOrdersNewIndex from './CustomersOrdersNewIndex';

const MAPOPTIONS = {
  zoom: 3,
  center: { lat: 40.612969, lng: -96.455751 } //center of US
};
//rate per mile
const RATE = 0.25;
//radius of trip finding
const RADIUS = 300;

class CustomersOrdersNew extends Component {
  constructor(props) {
    super(props);
    this.state = {
      newDistance: 0,
      deliveredBy: "",
      startLoc: "",
      endLoc: "",
      latS: 0,
      lngS: 0,
      latE: 0,
      lngE: 0,
      display: false,
      displayMap: false
    };
    this.today = new Date().toJSON().split("T")[0];

    this.handleSearch = this.handleSearch.bind(this);
    this.calculateDistance = this.calculateDistance.bind(this);
    // this.checkAndCalculate = this.checkAndCalculate.bind(this);
    this.sortTrips = this.sortTrips.bind(this);
    this.getGeo = this.getGeo.bind(this);
  }

  componentDidMount() {
    this.props.fetchAllUpcoming();
    const map = this.refs.map;
    this.map = new google.maps.Map(map, MAPOPTIONS);
    this.directionsService = new google.maps.DirectionsService();
    this.geocoder = new google.maps.Geocoder();

    this.directionsDisplay = new google.maps.DirectionsRenderer({
      map: this.map
    });
    window.scrollTo(0, 0);

    let HTMLMap = document.getElementById("map1");
    let searchDriverButton = document.getElementsByClassName("button-driver-search")[0];
    window.addEventListener("scroll", function(e){

      if (searchDriverButton.className === "button-driver-search on yes mapbutton"){
        if (window.scrollY > 580){
          let mid = window.innerWidth/2;
          HTMLMap.className="mapFix";
          HTMLMap.style.left = `${mid - 37}px`;
        } else {
          HTMLMap.className="mapFlex";
          HTMLMap.style.left = "0px";
        }
      } else {
        HTMLMap.className = "mapMid";
      }
    })
  }



  sortTrips() {
    let trips = this.props.entities.trips;
    let filterTrips = [];

    Object.values(trips).forEach(trip => {

      this.newDistance = Math.ceil(this.calculateDistance(trip.latO, trip.lngO, trip.latD, trip.lngD));

      let oldDistance = trip.tripDistance;
      var difference = this.newDistance - oldDistance;
      let tripPrice = (difference * RATE).toFixed(2);

      if ( (difference <= RADIUS) &&
           (difference > 0) &&
           (this.state.deliveredBy >= trip.tripEndDate) &&
           (trip.tripStartDate >= this.today) ) {
        this.props.updateTrip(trip._id,
          {
            price: tripPrice,
            tripNewDistance: this.newDistance
          }
        );
        filterTrips.push(trip);
      }
    });
    this.searchTrips = filterTrips;
    this.setState({ display: false });

    return filterTrips;
  }


  //O is Original location, D is original Destination
  //S is the customer Starting location, E is customer Ending location
  calculateDistance(latO, lngO, latD, lngD) {
    let latS = this.state.latS;
    let latE = this.state.latE;
    let lngS = this.state.lngS;
    let lngE = this.state.lngE;

    let leg1 = Math.sqrt(Math.pow(latO - latS, 2) + Math.pow(lngO - lngS, 2));
    let leg2 = Math.sqrt(Math.pow(latS - latE, 2) + Math.pow(lngS - lngE, 2));
    let leg3 = Math.sqrt(Math.pow(latE - latD, 2) + Math.pow(lngE - lngD, 2));

    //convert from lattitude to miles by * by 69
    let newDistance = (leg1 + leg2 + leg3) * 69;
    return newDistance;
  }

  // checkAndCalculate(latO, lngO, latD, lngD) {
  //   let newDistance;
  //   if (
  //     this.state.latS + this.state.latE + this.state.lngS + this.state.lngE ===
  //     0
  //   ) {
  //     setTimeout(() => this.checkAndCalculate(), 50);
  //   } else {
  //     newDistance = this.calculateDistance(
  //       latO, lngO, latD, lngD
  //     );
  //     return newDistance;
  //   }
  //   return newDistance;
  // }

  displayRoute(origin, destination, service, display) {
    service.route(
      {
        origin,
        destination,
        travelMode: "DRIVING",
        avoidTolls: true
      },
      (response, status) => {
        if (status === "OK") {
          if (this.state.deliveredBy > this.today) {
            display.setDirections(response);
          } else {
            alert("INVALID DATE");
          }
        } else {
          alert("COULD NOT DISPLAY DIRECTIONS DUE TO: " + status);
        }
      }
    );
  }

  handleInput(type) {
    return event => {
      this.setState({ [type]: event.target.value });
    };
  }

  geocodeAddress(geocoder, map, address) {
    return new Promise( (resolve, reject) => {
      geocoder.geocode({ address: address }, (result, status) => {
        if (status !== "OK") {
          alert("INVALID ADDRESS DUE TO: " + status);
          reject({});
        } else {
          resolve({
            lat: result[0].geometry.location.lat(),
            lng: result[0].geometry.location.lng()
          });
        }
      });
    });
  }

  async getGeo() {
    var getStart = this.geocodeAddress(this.geocoder, this.map, this.state.startLoc),
      getEnd = this.geocodeAddress(this.geocoder, this.map, this.state.endLoc);
    var start = await getStart;
    var end = await getEnd;
    this.setState({
      latS: start.lat,
      lngS: start.lng,
      latE: end.lat,
      lngE: end.lng
    })

    this.displayRoute(
      this.state.startLoc,
      this.state.endLoc,
      this.directionsService,
      this.directionsDisplay
    );

    let trips = this.props.entities.trips;
    let filterTrips = [];

    Object.values(trips).forEach(trip => {

      this.newDistance = Math.ceil(this.calculateDistance(trip.latO, trip.lngO, trip.latD, trip.lngD));
      let oldDistance = trip.tripDistance;
      var difference = this.newDistance - oldDistance;
      let tripPrice = (difference * RATE).toFixed(2);

      if ( (difference <= RADIUS) &&
           (difference > 0) &&
           (this.state.deliveredBy >= trip.tripEndDate) &&
           (trip.tripStartDate >= this.today) ) {
        this.props.updateTrip(trip._id,
          {
            price: tripPrice,
            tripNewDistance: this.newDistance
          }
        );
      }
    });


    this.setState({displayMap:true})
    window.scrollTo(0,500);

    let searchDriverButton = document.getElementsByClassName("button-driver-search")[0];
    // searchDriverButton.disabled = false;
    searchDriverButton.className = "button-driver-search on not mapbutton";

  }

  handleSearch() {

    //is there any way that we can make it so the button 'pops' out when
    //displayMap is true?

    if (this.state.displayMap === true){
      this.sortTrips();
      //if there is no matching trip, toggles display so that state changes => re-render
      if (this.searchTrips.length === 0) {
        this.setState({ display: true });
      }
      let searchDriverButton = document.getElementsByClassName("button-driver-search")[0];
      searchDriverButton.className = "button-driver-search on yes mapbutton";

      setTimeout(() => window.scrollTo(0, 500), 50);
    }

  }

  render() {
    if (this.props.entities.trips === null) {
      return <div>loading</div>;
    }

    return (
      <div className="trip-new">
        <h1 className="form-title barlow">CUSTOMERS</h1>
        <h2 className="form-description open">Send A Package Today</h2>

        <h3 className="form-start-loc">Package Pick Up Location</h3>
        <input
          type="text"
          id="cust-start"
          placeholder="Package Pickup Point (ex. 825 Battery St. San Francisco, CA 94111)"
          onChange={this.handleInput("startLoc")}
        />

        <h3 className="form-end-loc open">Package Drop Off Location</h3>
        <input
          type="text"
          id="cust-end"
          placeholder="Package Drop Off Point (ex. 6925 Hollywood Blvd, Hollywood, CA 90028)"
          onChange={this.handleInput("endLoc")}
        />

        <label>
          {" "}
          <h3 className="form-dates">Deliver By</h3>
          <input
            type="date"
            id="deliver-by"
            min={this.today}
            onChange={this.handleInput("deliveredBy")}
          />
        </label>

        <div className="map-div">
          <div className="buttons">
            <input
              type="submit"
              id="submit"
              value="DISPLAY MAP"
              className="button-map"
              onClick={this.getGeo}
              />

            <input
              type="submit"
              id="submit"
              className="button-driver-search off not mapbutton"

              value="PICK A DRIVER"
              onClick={this.handleSearch}
              />
          </div>

        <div className="map-mid">
            <div className="item-holder">
              <CustomersOrdersNewIndex
                filterTrips={this.searchTrips}
                startLoc={this.state.startLoc}
                endLoc={this.state.endLoc}
                map={this.map}
                service={this.directionsService}
                display={this.directionsDisplay}
                submitOrder={this.props.submitOrder}
                displayMessage={this.state.display}
                history={this.props.history}
                />

            </div>

            <div className="map-hold">
              <div id="map1" className="map-right mapMid">
                <div
                  id="map"
                  className="map"
                  ref="map"
                  style={{ width: 500, height: 500 }} />

              </div>

            </div>

            </div>

        </div>



      </div>
    );
  }
}

function mapStateToProps({ auth, entities }) {
  return {
    auth,
    entities
  };
}

export default connect(mapStateToProps, actions)(CustomersOrdersNew);
