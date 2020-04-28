import React, { useState, useEffect,} from 'react';
import { Segment, Header, Table, Sidebar, Popup, Grid, Menu, Icon, Image, Label, Container } from 'semantic-ui-react'
import { rawData } from './RawData';
import { DateInput } from 'semantic-ui-calendar-react';
import * as moment from 'moment';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const SearchPage = () => {

  const COLOR_MAP = ["#E8E8F0", "#b3cde0", "#6497b1", "#005b96", "#03396c"]; //, "#011f4b"];

  const [startDate, setStartDate] = useState(moment());
  const [endDate, setEndDate] = useState(moment());
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
    fetchData( startDate, endDate );

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
        data[`Camera ${c}`] = count;
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
            <Popup key={i} basic trigger={
                <Table.Cell style={{padding:p, border:"0px"}}>
                  <div style={{width:"20px", height:"20px", backgroundColor:color}} onClick={() => calculateGraphBucket(i, cameraIndex)}/>
                </Table.Cell>
                } flowing hoverable position={ i < dayNum/2 ? 'top left' : 'top right' }
                style={{maxWidth: '300px'}}>
              <Grid divided rows={2}>
                <Grid.Row textAlign='left'>
                  <Header as='h4' style={{margin: 'auto 1rem'}}>{header}</Header>
                </Grid.Row>
                {d.count > 0 && 
                  <div style={{marginBottom: '1rem'}}>
                    <Grid.Row textAlign='left'>
                      <p>
                        <b>Date </b> {moment(startDate).add(i, 'days').format('D/M/YYYY')}
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
      return (
        <Table.Row key={i}>
          <Table.Cell style={{ padding: p, border:"0px", whiteSpace: 'nowrap', fontWeight: 'bold', padding: '0 0.5rem 0 0', borderTop: i === 6 ? '1px solid gray' : '0px', textAlign: 'center' }}>
            { i === 0 ? 'AM' : ''}
            { i === 6 ? 'PM' : ''}
          </Table.Cell>
          {cameraRow(d, hourStart, hourEnd)}
        </Table.Row>
      );
    });

    const headers = Array.apply(null, Array(dayNum)).map((v , i) => {
      return <Table.HeaderCell style={{ padding:p, border:"0px", whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '20px'}} key={i}>   
        { i%7 === 0 ? moment(startDate).add(i, 'days').format('D/M') : ''}
        </Table.HeaderCell>;
    });

    return (
        <Table style={{padding:0, border:"0px"}}>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell style={{padding:p, border:"0px"}} />
              {headers}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {manyRows}
          </Table.Body>
        </Table>
    );
  };

  function handleDatePicker (e, {name, value}) {

    const date = moment(value, 'DD-MM-YYYY');
    if (name === 'endDate') {
      setEndDate(date);
      if (date.isBefore(startDate)) {
        setStartDate(date);
      }
      console.log('End date', value);
    } else if (name === 'startDate') {
      setStartDate(date);
      if (date.isAfter(endDate)) {
        setEndDate(date);
      }
      console.log('Start date', value);
    }
  }


  return (
    <Sidebar.Pushable>
      <Sidebar
        as={Menu}
        animation='overlay'
        icon='labeled'
        vertical
        visible={!showGraph}
      >
        <Grid textAlign='center' style={{padding: '2rem'}}>
          <Grid.Row columns={1}>
            <Grid.Column>
              <Header as='h1' textAlign='left' >Search Playback</Header>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row textAlign='left'>
            <div style={{margin: '0 0 0 1rem'}}>
              From 
              <div style={{display: "inline-block", margin: "0 10px"}}>
                <DateInput
                  name="startDate"
                  placeholder="From"
                  value={startDate.format('DD-MM-YYYY')}
                  iconPosition="left"
                  onChange={handleDatePicker}
                />
              </div>
              To 
              <div style={{display: "inline-block", margin: "0 10px"}}>
                <DateInput
                  name="endDate"
                  placeholder="To"
                  value={endDate.format('DD-MM-YYYY')}
                  iconPosition="left"
                  onChange={handleDatePicker}
                />
              </div>
              Search
              <div className="ui input" style={{display: "inline-block", margin: "0 10px"}}> <input type="text" placeholder="Keyword..." value={keyword} onChange={handleSearch}/></div>
            </div>
          </Grid.Row>
          {
            filteredBucket.map((b, i) => {
              return (
                <Grid.Row key={i}>
                  <Segment padded>
                    <Label color='blue' attached='top' size='large'>Camera {i}</Label>
                    {cameraTable(b, i)}
                  </Segment>
                </Grid.Row>
              );
            })
          }
        </Grid>
      </Sidebar>

      <Sidebar.Pusher>
        { showGraph && 
          <Segment basic>
            <Grid container columns={2}>
              <Grid.Column>
                <Header as='h3'>Detections from Camera {currentCamera} </Header>
                  Date {moment(startDate).add(currentDay, 'days').format('D/M/YYYY')}
              </Grid.Column>
              <Grid.Column textAlign='right'>
                <button className="ui secondary button" onClick={() => setShowGraph(false)}>Close</button>
              </Grid.Column>
            </Grid>
            <div style={{width: '100%', height: '300px'}}>
              <ResponsiveContainer>
                <LineChart
                    data={graphBucket}
                    margin={{
                      top: 40, right: 80, left: 80, bottom: 40,
                    }}
                    
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end"/>
                    <YAxis />
                    <Tooltip />
                    {
                      filteredBucket.map((c, index) => {
                        const label = `Camera ${index}`;
                        return index === currentCamera ? 
                          <Line type="monotone" dataKey={label} stroke="#0e659d" strokeWidth={3} activeDot={{ r: 8 }} key={index} /> : 
                          <Line type="monotone" dataKey={label} stroke="#bbb" key={index} />
                      })
                    }
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <Container>
                <Header as='h3'>Detail Information</Header>
                <Table basic='very' celled collapsing style={{marginLeft: '3rem'}}>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Time (hour)</Table.HeaderCell>
                      <Table.HeaderCell>Detected Label</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {
                      filteredBucket[currentCamera].map( (hour, i) => {
                        const label = Array.from(hour[currentDay].labels).sort().join(', ');
                        return (
                          <Table.Row key={i}>
                            <Table.Cell textAlign='center'>{2*i}-{2*i+2}</Table.Cell>
                            <Table.Cell>{label}</Table.Cell>
                          </Table.Row>
                        );
                      })
                    }
                  </Table.Body>
                </Table>
              </Container>
              
          </Segment>
        }
      </Sidebar.Pusher>
    </Sidebar.Pushable>
  );

};
export default SearchPage;
