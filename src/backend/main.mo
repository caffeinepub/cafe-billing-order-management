import Buffer "mo:base/Buffer";
import Text "mo:base/Text";
import Nat "mo:base/Nat";

actor {

  type OrderItem = {
    menuItemId : Text;
    name       : Text;
    price      : Nat;
    quantity   : Nat;
  };

  type Order = {
    id          : Text;
    orderNumber : Text;
    dateTime    : Text;
    items       : [OrderItem];
    total       : Nat;
    paymentType : Text;
  };

  type MenuItem = {
    id    : Text;
    name  : Text;
    price : Nat;
  };

  type Category = {
    id    : Text;
    name  : Text;
    items : [MenuItem];
  };

  // Keep old stable variable names so the upgrade does not fail
  stable var orders  : [Order]    = [];
  stable var menu    : [Category] = [];
  stable var counter : Nat        = 1;

  public shared func login(username : Text, password : Text) : async Bool {
    username == "simplesips" and password == "simplesips@03"
  };

  public query func getOrders() : async [Order] {
    orders
  };

  public shared func addOrder(order : Order) : async Bool {
    let buf = Buffer.fromArray<Order>(orders);
    buf.add(order);
    orders := Buffer.toArray(buf);
    true
  };

  public shared func deleteOrder(id : Text) : async Bool {
    let buf = Buffer.Buffer<Order>(orders.size());
    for (o in orders.vals()) {
      if (o.id != id) { buf.add(o) };
    };
    orders := Buffer.toArray(buf);
    true
  };

  public shared func deleteOrdersByDate(dateKey : Text) : async Nat {
    let before = orders.size();
    let buf = Buffer.Buffer<Order>(orders.size());
    for (o in orders.vals()) {
      if (not Text.startsWith(o.dateTime, #text dateKey)) {
        buf.add(o);
      };
    };
    orders := Buffer.toArray(buf);
    before - orders.size()
  };

  public shared func updateOrderPayment(id : Text, paymentType : Text) : async Bool {
    let buf = Buffer.Buffer<Order>(orders.size());
    for (o in orders.vals()) {
      if (o.id == id) {
        let updated : Order = {
          id          = o.id;
          orderNumber = o.orderNumber;
          dateTime    = o.dateTime;
          items       = o.items;
          total       = o.total;
          paymentType = paymentType;
        };
        buf.add(updated);
      } else {
        buf.add(o);
      };
    };
    orders := Buffer.toArray(buf);
    true
  };

  public query func getMenu() : async [Category] {
    menu
  };

  public shared func saveMenu(newMenu : [Category]) : async Bool {
    menu := newMenu;
    true
  };

  public shared func getNextOrderNumber() : async Nat {
    let current = counter;
    counter += 1;
    current
  };

};
