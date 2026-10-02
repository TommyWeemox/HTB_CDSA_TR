# Réseau

## Wireshark (filtres d'affichage)

```
ip.addr == 10.0.0.5 && tcp.port == 443
http.request || dns
tcp.flags.syn == 1 && tcp.flags.ack == 0
frame contains "powershell"
```

## tshark

```bash
tshark -r cap.pcap -Y "http.request" -T fields -e ip.src -e http.host -e http.request.uri
tshark -r cap.pcap -q -z conv,tcp
tshark -r cap.pcap --export-objects http,out/
```

## Zeek

```bash
zeek -r cap.pcap
cat conn.log | zeek-cut id.orig_h id.resp_h id.resp_p duration orig_bytes
cat dns.log  | zeek-cut query | sort | uniq -c | sort -rn | head
```

## Suricata

```bash
suricata -r cap.pcap -l out/ -S local.rules
jq 'select(.event_type=="alert")' out/eve.json
```
