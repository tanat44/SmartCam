import React, { useState, useEffect,} from 'react';
import { Segment, Header, Table, Label, Popup, Grid } from 'semantic-ui-react'
import { rawData } from './RawData';
import { DateInput } from 'semantic-ui-calendar-react';
import * as moment from 'moment';
import './SearchPage.css';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const SearchPage = () => {

  const COLOR_MAP = ["#E8E8F0", "#b3cde0", "#6497b1", "#005b96", "#03396c"]; //, "#011f4b"];

  const [startDate, setStartDate] = useState(moment().format('DD-MM-YYYY'));
  const [endDate, setEndDate] = useState(moment().format('DD-MM-YYYY'));
  const [originalBucket, setOriginalBucket] = useState([]);
  const [filteredBucket, setFilteredBucket] = useState([]);
  const [graphBucket, setGraphBucket] = useState([])
  const [maxDetection, setMaxDetection] = useState(COLOR_MAP.length);
  const [cameraNum, setCameraNum] = useState(0);
  const [dayNum, setDayNum] = useState(0);
  const [hourNum, setHourNum] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [showGraph, setShowGraph] = useState(false);
  const [currentCamera, setCurrentCamera] = useState(0);
  const [currentDay, setCurrentDay] = useState(0);

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

  function calculateGraphBucket(day, cameraIndex) {
    let b = [];
    let maxCount = -1;
    for (let i=0; i < hourNum; i++) {
      let data = {};
      data.name = `${2*i}-${2*i+2}`;
      for (let c=0; c < cameraNum; c++) {
        const count = filteredBucket[c][i][day].count;
        data[`Camera${c}`] = count;
        if (count > maxCount){
          maxCount = count;
        }
      }
      b.push(data);
    }
    setGraphBucket(b);
    setCurrentCamera(cameraIndex);
    setShowGraph(true);
    setCurrentDay(day);
  }

  function handleSearch(e) {
    const value = e.target.value;
    if (value.length === 0) {
      setFilteredBucket(originalBucket);
    } else if (value.length > 2) {
      filterBucket(value);
    } 
    setShowGraph(false);
    setKeyword(value);
    
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

  const cameraTable = (data, cameraIndex) => {

    let p = "1px";

    const cameraRow = (data, hourStart, hourEnd) => {
      const row = data.map((d, i) => {
        let color = COLOR_MAP[Math.ceil(Math.log2(d.count + 1) / Math.log2(maxDetection + 1) * (COLOR_MAP.length - 1))];
        const header = d.count === 0 ? 'No detection' : `${d.count} Detections`
        let label = '';
        if(d.count > 0)
          label = Array.from(d.labels).sort().join(', ');
        return (
            <Popup trigger={
                <Table.Cell style={{padding:p, border:"0px"}}>
                  <div style={{width:"20px", height:"20px", backgroundColor:color}} onClick={() => calculateGraphBucket(i, cameraIndex)}/>
                </Table.Cell>
                } flowing hoverable
                style={{maxWidth: '300px'}}>
              <Grid divided rows={2}>
                <Grid.Row textAlign='left'>
                  <Header as='h4' style={{margin: 'auto 1rem'}}>{header}</Header>
                </Grid.Row>
                {d.count > 0 && 
                  <div style={{marginBottom: '1rem'}}>
                    <Grid.Row textAlign='left'>
                      <p>
                        <b>Date </b> {moment(startDate, 'DD-MM-YYYY').add(i, 'days').format('D/M/YYYY')}
                      </p>
                    </Grid.Row>
                    <Grid.Row textAlign='left'>
                      <p>
                        <b>Time </b> {hourStart}-{hourEnd}
                      </p>
                    </Grid.Row>
                    <Grid.Row textAlign='left'>
                      <p>
                        <b>Labels </b> {label}
                      </p>
                    </Grid.Row>
                  </div>
                }
              </Grid>
            </Popup>
        );
      });
      return row;
    };
  
    const manyRows = data.map((d, i) => {
      const hourStart = 2*i;
      const hourEnd = 2*i+2;
      return (<Table.Row key={i}>
        <Table.Cell style={{ padding: p, border:"0px", whiteSpace: 'nowrap'}}>
          {hourStart}-{hourEnd}
        </Table.Cell>
        {cameraRow(d, hourStart, hourEnd)}
      </Table.Row>);
    });

    const headers = Array.apply(null, Array(dayNum)).map((v , i) => {
      return <Table.HeaderCell style={{ padding:p, border:"0px", fontSize: '8px' }}>   
        { i%7 == 0 ? moment(startDate, 'DD-MM-YYYY').add(i, 'days').format('D/M') : ''}
        </Table.HeaderCell>;
    });

    return (
        <Table collapsing basic size='small' style={{padding:0, border:"0px"}}>
          <Table.Body>
            <Table.HeaderCell style={{padding:p, border:"0px"}}>
              Date
            </Table.HeaderCell>
            {headers}
            {manyRows}
          </Table.Body>
        </Table>
    );
  };

  function handleDatePicker (e, {name, value}) {
    if (name === 'endDate') {
      setEndDate(moment(value).format('DD-MM-YYYY'));
      if (moment(value) < moment(startDate)) {
        setStartDate(moment(value).format('DD-MM-YYYY'));
      }
    } else if (name === 'startDate') {
      setStartDate(moment(value).format('DD-MM-YYYY'));
      if (moment(value) > moment(endDate)) {
        setEndDate(moment(value).format('DD-MM-YYYY'));
      }
    }
  }

  return (
    <div className="screen">
      <Header as='h1' content ='Search Playback' textAlign='left' />
      <div style={{margin: '2rem 0'}}>
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
        <div className="ui input" style={{display: "inline-block", margin: "0 10px"}}> <input type="text" placeholder="Keyword..." value={keyword} onChange={handleSearch}/></div>
      </div>
      <div style={{display: 'flex', flexFlow: 'row', flex: '1 1 auto', overflow: 'auto'}}> 
        <div style={{display: 'flex', flex: '0 1 auto', overflow: 'auto', flexDirection: 'column', maxWidth: showGraph ? '70%' : '100%'}} >
          {
            filteredBucket.map((b, i) => {
              return (
                <div style={{display: 'flex'}}>
                  <Segment key={i}>
                    <Label color='blue' size='big'>Camera {i+1}</Label>
                    {cameraTable(b, i)}
                  </Segment>
                </div>
              );
            })
          }
        </div>
        { showGraph && 
          <div style={{display: 'flex', flex: '1 1 auto', flexDirection: 'column'}}>
            <div style={{display: 'flex', marginLeft: '2rem', fontWeight: 'bold'}}>
              Camera {currentCamera}
            </div>
            <div style={{display: 'flex', margin: '0 0 1rem 2rem'}}>
              Date {moment(startDate, 'DD-MM-YYYY').add(currentDay, 'days').format('D/M/YYYY')}
            </div>
            <LineChart
              width={500}
              height={300}
              data={graphBucket}
              margin={{
                top: 5, right: 30, left: 20, bottom: 5,
              }}
              style={{display: 'flex'}}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" interval={0}/>
              <YAxis />
              <Tooltip />
              <Legend />
              {
                filteredBucket.map((c, index) => {
                  const label = `Camera${index + 1}`;
                  return index === currentCamera ? 
                    <Line type="monotone" dataKey={label} stroke="#0e659d" strokeWidth={3} activeDot={{ r: 8 }} /> : 
                    <Line type="monotone" dataKey={label} stroke="#bbb" />
                })
              }
            </LineChart>
        </div>}
      </div>     
    </div>
  );

};
export default SearchPage;
