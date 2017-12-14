/* eslint-disable no-undef */

import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import './DriversTripsNew.css';

const kmToMile = 0.621371/1000;
const mapOptions = {
  zoom: 3,
  center: {lat: 40.612969, lng: -96.455751 } //center at the US
};

class DriversTripsNew extends Component {
  constructor(props) {
    super(props);

    this.state = {
      origin: "",
      destination: "",
      tripStartDate: "",
      tripEndDate: "",
      tripDistance: 0
    };

    this.handleDisplay = this.handleDisplay.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.today = new Date().toJSON().split('T')[0];
  }

  componentDidMount() {
    const map = this.refs.map;
    //define where our initial map should be centered
    this.map = new google.maps.Map(map, mapOptions);
    //DirectionsService take care of handling our map direction
    this.directionsService = new google.maps.DirectionsService();

  //DirectionsRenderer will take care of displaying the route onto
  //the map and direction onto panel, just comment out panel:... if dont wanna show direction
    this.directionsDisplay = new google.maps.DirectionsRenderer({
      map: this.map,
      // panel: document.getElementById('direction-panel'),
    });

  }


  //this handles displaying the route onto the map.
  displayRoute(origin, destination, service, display) {
    service.route({
      origin: origin,
      destination: destination,
      travelMode: 'DRIVING',
      avoidTolls: true
    }, (response, status) => {
      if (status === 'OK') {
        display.setDirections(response);

        var route = response.routes[0];
        let tripDistance = Math.ceil((route.legs[0].distance.value * kmToMile));
        console.log(tripDistance);
        this.setState ({ tripDistance: tripDistance });
      } else {
        alert('Could not display directions due to: ' + status);
      }
    });
    console.log(this.state);
  }

  handleInput(type) {
    return (event) => {
      this.setState({ [type]: event.target.value});
    };
  }


  handleDisplay() {
    let origin = this.state.origin;
    let destination = this.state.destination;
    this.displayRoute(
      origin, destination,
      this.directionsService, this.directionsDisplay
    );
  }

  handleSubmit() {
    this.props.submitTrip({
      origin: this.state.origin,
      destination: this.state.destination,
      tripStartDate: this.state.tripStartDate,
      tripEndDate: this.state.tripEndDate,
      completed: false
    });
  }

  render() {

    return (
      <div className="trip-new">

        <h1 className="form-title barlow">DRIVERS</h1>
        <h2 className="form-description open">Make bank by posting your trip route</h2>
          <h3 className="form-start-loc">Starting Location</h3>
            <input  type="text" id="driver-start"
              placeholder=""
              onChange={this.handleInput('origin')}></input>

          <h3 className="form-end-loc open">Destination</h3>
            <input  type="text" id="driver-end"
              placeholder=""
              onChange={this.handleInput('destination')}></input>

          <div className="form-dates open">
            <div className="form-date-input">
              <h3>Departure Date</h3>
              <input type="date" id="date-start"
                min={this.today}
                onChange={this.handleInput('tripStartDate')}></input>
            </div>

            <div className="form-date-input">
              <h3>Arrival Date</h3>
              <input type="date" id="date-end"
                min={this.today}
                onChange={this.handleInput('tripEndDate')}></input>
            </div>
          </div>
          <div className="map-div">
            <input
              type="submit" id="submit"
              value="Next"
              className="map-button"
              onClick={this.handleDisplay} />

            <div className="map" ref="map" style={{width: 700, height: 700}}>
              Map
            </div>
            <div id="direction-panel"></div>

            <h5 className="confirm-q">Is this the route you're taking?</h5>
            <button className="confirm-trip" onClick={this.handleSubmit}>
              Confirm Trip
            </button>

        </div>




      </div>
    );
  }
}

export default connect(null, actions)(DriversTripsNew);


//actions contains submitTrip.
