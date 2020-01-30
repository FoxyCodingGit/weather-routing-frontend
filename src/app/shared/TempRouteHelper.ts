export class TempRouteHelper {
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
              console.log('No results found');
              reject('Error!');
            }
          });
        });
      }
}