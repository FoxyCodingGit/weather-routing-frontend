export class TempRouteHelper {
    public static getLatLngValue(address: string): Promise<google.maps.LatLng> {
      let geocoder = new google.maps.Geocoder;

      return new Promise(function(resolve, reject) {
        geocoder.geocode( {address: address}, function (results) {
          if (!results) {
            return 'Geocoder passed but result null';
          } else if (results[0]) {
            resolve(new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng()));
          } else {
            console.log('Something errored when trying to get latlng from location name');
            reject('Error!');
          }
        });
      });
    }

    public static getLocationName(latLng: google.maps.LatLng): Promise<string> {
        let geocoder = new google.maps.Geocoder;
        
        return new Promise(function(resolve, reject) {
          geocoder.geocode({ 'location': latLng }, function (results) {
            let addressOutput = '';
    
            if (!results) {
              addressOutput = 'Geocoder passed but result null';
            } else if (results[0]) {
              //that.zoom = 11;
              //that.currentLocation = results[0].formatted_address;
    
              console.log(results[0]);
    
              results[0].address_components.forEach(addressPart => {
                if (addressPart.types[0] === 'street_number'
                || addressPart.types[0] === 'route'
                || addressPart.types[0] === 'postal_code') {
                  addressOutput += addressPart.long_name + ' ';
                }
              });
    
              addressOutput = addressOutput.substring(0, addressOutput.length - 1);
    
              resolve(addressOutput);
            } else {
              reject('Error!');
            }
          });
        });
      }
}