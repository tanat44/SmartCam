import React, { useState, useEffect,} from 'react';
import { Segment, Header, Table, Label, Popup, } from 'semantic-ui-react'
import { rawData } from './RawData';
import { DateInput } from 'semantic-ui-calendar-react';
import * as moment from 'moment';

const SearchPage = () => {

  const COLOR_MAP = ["#E8E8F0", "#b3cde0", "#6497b1", "#005b96", "#03396c"]; //, "#011f4b"];

  const [startDate, setStartDate] = useState(moment('DD-MM-YYYY'));
  const [endDate, setEndDate] = useState(moment().format('DD-MM-YYYY'));
  const [originalBucket, setOriginalBucket] = useState([]);
  const [filteredBucket, setFilteredBucket] = useState([]);
  const [maxDetection, setMaxDetection] = useState(COLOR_MAP.length);
  const [cameraNum, setCameraNum] = useState(0);
  const [dayNum, setDayNum] = useState(0);
  const [hourNum, setHourNum] = useState(0);

  useEffect (() => {
    fetchData();

  }, [startDate, endDate])

  function initBucket(camera, hour, day) {
    let b = Array.apply(null, Array(camera)).map(() => {
      return Array.apply(null, Array(hour)).map(() => {
        return Array.apply(null, Array(day)).map(() => {
          return {count: 0, labels: new Set()};
        });
      });
    });
    return b;
  }


  
  function filterBucket (keyword) {
    keyword = keyword.toLowerCase();

    let myBucket = initBucket(cameraNum, hourNum, dayNum);
    originalBucket.forEach( (camera, camera_i) => {
      camera.forEach( (hours, hour_i) => {
        hours.forEach ( (date, date_i) => {
          date.labels.forEach( (name) => {
            const thisName = name.toLowerCase();
            if (thisName.includes(keyword)) {
              myBucket[camera_i][hour_i][date_i].count += 1;
              myBucket[camera_i][hour_i][date_i].labels.add(name);
            }
          })
        })
      })
    });
    setFilteredBucket(myBucket);
  }

  function handleSearch(e) {
    const value = e.target.value;
    if (value.length === 0) {
      setFilteredBucket(originalBucket);
    } else if (value.length > 2) {
      filterBucket(value);
    }
    
  }



  function fetchData () {
    let data = JSON.parse(rawData);

    // preprocessing (convert data into bucket format)
    let camNum = data.length;
    let dayNum = data[0].length;
    let hourNum = 12;
    let bucket = initBucket(camNum, hourNum, dayNum);
    let maxDet = COLOR_MAP.length;
    data.forEach((c, i) => {
      c.forEach((d, j) => {
        d.forEach((det, k) => {
          let dt = new Date(det.time);
          let h = ~~(dt.getHours() / 2);
          bucket[i][h][j].count += 1;
          bucket[i][h][j].labels.add(det.label);
  
          if(bucket[i][h][j].count > maxDet)
            maxDet = bucket[i][h][j].count;
        })
      })
    });

    setOriginalBucket(bucket);
    setFilteredBucket(bucket);
    setMaxDetection(maxDet);
    setCameraNum(camNum);
    setDayNum(dayNum);
    setHourNum(hourNum);

  }

  const cameraTable = (data) => {

    let p = "1px";

    const cameraRow = (data) => {
      const row = data.map((d, i) => {
        let color = COLOR_MAP[Math.ceil(Math.log2(d.count + 1) / Math.log2(maxDetection + 1) * (COLOR_MAP.length - 1))];
        let content = "0";
        if(d.count > 0)
          content = d.count.toString() + " : [" + Array.from(d.labels).join(', ') + "]";
        return (
            <Popup
              key={i}
              content={content}
              trigger={
                <Table.Cell style={{padding:p, border:"0px"}}>
                  <div style={{width:"20px", height:"20px", backgroundColor:color}}/>
                </Table.Cell>
              }
              position='top center'
            />
        );
      });
      return row;
    };
  
    const manyRows = data.map((d, i) => {
      return (<Table.Row key={i}>
        <Table.Cell style={{padding:p, border:"0px"}}>
          {2*i}-{2*i+2}
        </Table.Cell>
        {cameraRow(d)}
      </Table.Row>);
    });

    const headers = Array.apply(null, Array(dayNum + 1)).map(() => {
      return (<Table.HeaderCell style={{padding:p, border:"0px"}}>a</Table.HeaderCell>);
    });

    return (
        <Table collapsing basic size='small' style={{padding:0, border:"0px"}}>
          <Table.Body>
            {headers}
            {manyRows}
          </Table.Body>
        </Table>
    );
  };

  function handleDatePicker (e, {name, value}) {
    if (name === 'endDate') {
      setEndDate(value);
      if (moment(value) < moment(startDate)) {
        setStartDate(value);
      }
    } else if (name === 'startDate') {
      setStartDate(value);
      if (moment(value) > moment(endDate)) {
        setEndDate(value);
      }
    }
  }

  return (
    <div>
      <Header as='h1' content ='Search Playback' textAlign='left' />
      <div>
        From 
        <div style={{display: "inline-block", margin: "0 10px"}}>
          <DateInput
            name="startDate"
            placeholder="From"
            value={startDate}
            iconPosition="left"
            onChange={handleDatePicker}
          />
        </div>
        To 
        <div style={{display: "inline-block", margin: "0 10px"}}>
          <DateInput
            name="endDate"
            placeholder="To"
            value={endDate}
            iconPosition="left"
            onChange={handleDatePicker}
          />
        </div>
        Search
        <div className="ui input" style={{display: "inline-block", margin: "0 10px"}}> <input type="text" placeholder="Keyword..." onChange={handleSearch}/></div>
      </div>

      <div style={{ overflowY: 'auto', maxHeight: '100%' }}>
        {
          filteredBucket.map((b, i) => {
            return (
              <Segment key={i}>
                <Label color='blue' size='big'>Camera {i}</Label>
                {cameraTable(b)}
              </Segment>
            );
          })
        }
      </div>

        <Segment>Content</Segment>
      
    </div>
  );

};
export default SearchPage;
